<?php
/**
 * Database installer & manager for KAIA
 */

if (!defined('ABSPATH')) {
    exit;
}

class KAIA_DB {
    public static function get_table_prefix() {
        global $wpdb;
        return $wpdb->prefix . 'kaia_';
    }

    public static function install() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();
        $prefix = self::get_table_prefix();

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

        // 1. Companies / Empresas
        $sql_companies = "CREATE TABLE IF NOT EXISTS {$prefix}companies (
            id varchar(64) NOT NULL,
            nombreComercial varchar(255) NOT NULL,
            razonSocial varchar(255) NOT NULL,
            cif varchar(64) NOT NULL,
            direccion text,
            codigoPostal varchar(32),
            ciudad varchar(128),
            provincia varchar(128),
            pais varchar(128) DEFAULT 'España',
            telefono varchar(64),
            email varchar(128),
            web varchar(255),
            iban varchar(128),
            banco varchar(128),
            swift varchar(64),
            condicionesPago text,
            ivaPorDefecto decimal(5,2) DEFAULT 21.00,
            retencionIRPF decimal(5,2) DEFAULT 0.00,
            cuentaBancaria varchar(128),
            registroMercantil text,
            condicionesDefecto text,
            pieFacturaDefecto text,
            moneda varchar(16) DEFAULT 'EUR',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($sql_companies);

        // 2. Clients / Clientes
        $sql_clients = "CREATE TABLE IF NOT EXISTS {$prefix}clients (
            id varchar(64) NOT NULL,
            wp_user_id bigint(20) unsigned DEFAULT 0,
            company_id varchar(64) DEFAULT NULL,
            nombre varchar(255) NOT NULL,
            apellidos varchar(255),
            empresa varchar(255),
            cif varchar(64),
            email varchar(128),
            telefono varchar(64),
            direccion text,
            codigoPostal varchar(32),
            ciudad varchar(128),
            provincia varchar(128),
            pais varchar(128) DEFAULT 'España',
            notas text,
            estado varchar(32) DEFAULT 'Activo',
            fechaAlta varchar(64),
            fechaModificacion varchar(64),
            isDemo tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY wp_user_id (wp_user_id),
            KEY company_id (company_id)
        ) $charset_collate;";
        dbDelta($sql_clients);

        // 3. Services / Servicios
        $sql_services = "CREATE TABLE IF NOT EXISTS {$prefix}services (
            id varchar(64) NOT NULL,
            nombre varchar(255) NOT NULL,
            categoria varchar(128),
            descripcion text,
            precio decimal(12,2) DEFAULT 0.00,
            clienteId varchar(64),
            empresaId varchar(64),
            estado varchar(32) DEFAULT 'Activo',
            fechaContratacion varchar(64),
            fechaRenovacion varchar(64),
            notas text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY clienteId (clienteId),
            KEY empresaId (empresaId)
        ) $charset_collate;";
        dbDelta($sql_services);

        // 4. Domains / Dominios
        $sql_domains = "CREATE TABLE IF NOT EXISTS {$prefix}domains (
            id varchar(64) NOT NULL,
            dominio varchar(255) NOT NULL,
            clienteId varchar(64),
            empresaId varchar(64),
            proveedor varchar(255),
            fechaAlta varchar(64),
            fechaRenovacion varchar(64),
            estado varchar(64) DEFAULT 'Activo',
            coste decimal(12,2) DEFAULT 0.00,
            notas text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY clienteId (clienteId),
            KEY empresaId (empresaId)
        ) $charset_collate;";
        dbDelta($sql_domains);

        // 5. Hosting / Alojamientos
        $sql_hosting = "CREATE TABLE IF NOT EXISTS {$prefix}hosting (
            id varchar(64) NOT NULL,
            clienteId varchar(64),
            empresaId varchar(64),
            proveedor varchar(255),
            servicio varchar(255),
            plan varchar(255),
            servidor varchar(255),
            fechaContratacion varchar(64),
            fechaRenovacion varchar(64),
            coste decimal(12,2) DEFAULT 0.00,
            estado varchar(64) DEFAULT 'Activo',
            notas text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY clienteId (clienteId),
            KEY empresaId (empresaId)
        ) $charset_collate;";
        dbDelta($sql_hosting);

        // 6. Projects / Proyectos
        $sql_projects = "CREATE TABLE IF NOT EXISTS {$prefix}projects (
            id varchar(64) NOT NULL,
            titulo varchar(255) NOT NULL,
            clienteId varchar(64) NOT NULL,
            empresaId varchar(64),
            servicio varchar(255),
            descripcion text,
            estado varchar(64) DEFAULT 'En curso',
            fechaInicio varchar(64),
            fechaPrevista varchar(64),
            importe decimal(12,2) DEFAULT 0.00,
            responsable varchar(255),
            presupuestoId varchar(64),
            notas text,
            tareas_json longtext,
            fechaCreacion varchar(64),
            fechaModificacion varchar(64),
            isDemo tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY clienteId (clienteId),
            KEY empresaId (empresaId)
        ) $charset_collate;";
        dbDelta($sql_projects);

        // 7. Quotes / Presupuestos
        $sql_quotes = "CREATE TABLE IF NOT EXISTS {$prefix}quotes (
            id varchar(64) NOT NULL,
            clienteId varchar(64) NOT NULL,
            empresaId varchar(64),
            fecha varchar(64) NOT NULL,
            validez varchar(64),
            estado varchar(64) DEFAULT 'Borrador',
            lineas_json longtext,
            subtotal decimal(12,2) DEFAULT 0.00,
            descuentoTotal decimal(12,2) DEFAULT 0.00,
            ivaTotal decimal(12,2) DEFAULT 0.00,
            irpfTotal decimal(12,2) DEFAULT 0.00,
            total decimal(12,2) DEFAULT 0.00,
            condicionesPago text,
            formaPago varchar(128),
            plazoEntrega varchar(128),
            revisiones varchar(128),
            cancelacion varchar(128),
            notas text,
            observaciones text,
            plantillaConfig_json longtext,
            fechaCreacion varchar(64),
            fechaModificacion varchar(64),
            isDemo tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY clienteId (clienteId),
            KEY empresaId (empresaId)
        ) $charset_collate;";
        dbDelta($sql_quotes);

        // 8. Invoices / Facturas
        $sql_invoices = "CREATE TABLE IF NOT EXISTS {$prefix}invoices (
            id varchar(64) NOT NULL,
            clienteId varchar(64) NOT NULL,
            empresaId varchar(64),
            presupuestoId varchar(64),
            proyectoId varchar(64),
            fechaEmision varchar(64) NOT NULL,
            fechaVencimiento varchar(64) NOT NULL,
            formaPago varchar(128),
            metodoPago varchar(128),
            cuentaBancaria varchar(128),
            lineas_json longtext,
            pagos_json longtext,
            baseImponible decimal(12,2) DEFAULT 0.00,
            ivaTotal decimal(12,2) DEFAULT 0.00,
            irpfTotal decimal(12,2) DEFAULT 0.00,
            total decimal(12,2) DEFAULT 0.00,
            importePagado decimal(12,2) DEFAULT 0.00,
            importePendiente decimal(12,2) DEFAULT 0.00,
            estado varchar(64) DEFAULT 'Borrador',
            notas text,
            pieFactura text,
            plantillaConfig_json longtext,
            fechaCreacion varchar(64),
            fechaModificacion varchar(64),
            isDemo tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY clienteId (clienteId),
            KEY empresaId (empresaId)
        ) $charset_collate;";
        dbDelta($sql_invoices);

        // 9. Finances / Movimientos
        $sql_finances = "CREATE TABLE IF NOT EXISTS {$prefix}finances (
            id varchar(64) NOT NULL,
            fecha varchar(64) NOT NULL,
            tipo varchar(32) NOT NULL,
            categoria varchar(128) NOT NULL,
            descripcion text NOT NULL,
            importe decimal(12,2) NOT NULL,
            metodo varchar(128),
            estado varchar(64) DEFAULT 'Completado',
            clienteId varchar(64),
            empresaId varchar(64),
            proyectoId varchar(64),
            facturaId varchar(64),
            fechaCreacion varchar(64),
            isDemo tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY clienteId (clienteId),
            KEY empresaId (empresaId)
        ) $charset_collate;";
        dbDelta($sql_finances);

        // 10. Documents / Documentos
        $sql_documents = "CREATE TABLE IF NOT EXISTS {$prefix}documents (
            id varchar(64) NOT NULL,
            nombre varchar(255) NOT NULL,
            categoria varchar(128),
            tamano varchar(64),
            tipo varchar(64),
            fechaSubida varchar(64),
            clienteId varchar(64),
            empresaId varchar(64),
            proyectoId varchar(64),
            servicioId varchar(64),
            url text,
            notas text,
            isDemo tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY clienteId (clienteId),
            KEY empresaId (empresaId)
        ) $charset_collate;";
        dbDelta($sql_documents);

        // 11. Commercial Leads / Oportunidades
        $sql_leads = "CREATE TABLE IF NOT EXISTS {$prefix}leads (
            id varchar(64) NOT NULL,
            empresa varchar(255) NOT NULL,
            contacto varchar(255),
            email varchar(128),
            telefono varchar(64),
            origen varchar(128),
            servicioInteres varchar(255),
            estado varchar(64) DEFAULT 'Nuevo',
            fase varchar(64) DEFAULT 'Contacto',
            valorEstimado decimal(12,2) DEFAULT 0.00,
            probabilidad decimal(5,2) DEFAULT 50.00,
            responsable varchar(255),
            proximoPaso text,
            fechaContacto varchar(64),
            proximoSeguimiento varchar(64),
            fechaPrevistaCierre varchar(64),
            clienteId varchar(64),
            empresaId varchar(64),
            notas text,
            fechaCreacion varchar(64),
            isDemo tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($sql_leads);

        // 12. Suppliers / Proveedores
        $sql_suppliers = "CREATE TABLE IF NOT EXISTS {$prefix}suppliers (
            id varchar(64) NOT NULL,
            proveedor varchar(255) NOT NULL,
            empresa varchar(255),
            cif varchar(64),
            contacto varchar(255),
            email varchar(128),
            telefono varchar(64),
            web varchar(255),
            servicio text,
            condiciones text,
            direccion text,
            iban varchar(128),
            estado varchar(32) DEFAULT 'Activo',
            notas text,
            fechaCreacion varchar(64),
            fechaModificacion varchar(64),
            isDemo tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($sql_suppliers);

        // 13. Products / Productos
        $sql_products = "CREATE TABLE IF NOT EXISTS {$prefix}products (
            id varchar(64) NOT NULL,
            codigo varchar(64),
            nombre varchar(255) NOT NULL,
            referencia varchar(128),
            categoria varchar(128),
            descripcion text,
            precio decimal(12,2) DEFAULT 0.00,
            iva decimal(5,2) DEFAULT 21.00,
            unidad varchar(64) DEFAULT 'unidad',
            stock int(11) DEFAULT 0,
            stockMinimo int(11) DEFAULT 0,
            proveedorId varchar(64),
            estado varchar(64) DEFAULT 'Disponible',
            fechaCreacion varchar(64),
            fechaModificacion varchar(64),
            isDemo tinyint(1) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($sql_products);

        // 14. Activities / Actividades
        $sql_activities = "CREATE TABLE IF NOT EXISTS {$prefix}activities (
            id varchar(64) NOT NULL,
            fecha varchar(64) NOT NULL,
            descripcion text NOT NULL,
            tipo varchar(64) NOT NULL,
            entidadId varchar(64),
            targetView varchar(64),
            targetId varchar(64),
            usuario varchar(255) DEFAULT 'Sistema',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($sql_activities);

        // 15. Settings / Configuración
        $sql_settings = "CREATE TABLE IF NOT EXISTS {$prefix}settings (
            id varchar(64) NOT NULL DEFAULT 'SETTINGS_DEFAULT',
            tema varchar(32) DEFAULT 'claro',
            formatoFecha varchar(32) DEFAULT 'DD/MM/YYYY',
            moneda varchar(16) DEFAULT 'EUR',
            autoGuardar tinyint(1) DEFAULT 1,
            backupUltimaFecha varchar(64),
            prefijoPresupuesto varchar(32) DEFAULT 'PRE',
            prefijoFactura varchar(32) DEFAULT 'FAC',
            prefijoProyecto varchar(32) DEFAULT 'PRO',
            prefijoCliente varchar(32) DEFAULT 'CLI',
            incluirAno tinyint(1) DEFAULT 1,
            digitosNumero int(11) DEFAULT 4,
            separadorDecimal varchar(8) DEFAULT ',',
            plantillaPresupuestoDefecto_json longtext,
            plantillaFacturaDefecto_json longtext,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($sql_settings);

        // Insert initial company record if missing
        $company_exists = $wpdb->get_var("SELECT COUNT(*) FROM {$prefix}companies");
        if (!$company_exists) {
            $wpdb->insert("{$prefix}companies", array(
                'id' => 'COMPANY_DEFAULT',
                'nombreComercial' => 'KAIA Agency & Tech Solutions',
                'razonSocial' => 'KAIA Business Solutions S.L.',
                'cif' => 'B-98765432',
                'direccion' => 'Paseo de la Castellana 120, Planta 4',
                'codigoPostal' => '28046',
                'ciudad' => 'Madrid',
                'provincia' => 'Madrid',
                'pais' => 'España',
                'telefono' => '+34 910 000 111',
                'email' => 'contacto@kaiabusiness.es',
                'web' => 'https://kaiabusiness.es',
                'iban' => 'ES21 0049 1825 31 1234567890',
                'banco' => 'Banco Santander',
                'swift' => 'BSANESMMXXX',
                'condicionesPago' => 'Transferencia bancaria a 30 días desde fecha de factura.',
                'ivaPorDefecto' => 21.00,
                'retencionIRPF' => 0.00,
                'cuentaBancaria' => 'ES21 0049 1825 31 1234567890',
                'registroMercantil' => 'Registro Mercantil de Madrid, Tomo 1234, Folio 56, Hoja M-78901',
                'condicionesDefecto' => 'Presupuesto válido por 30 días. Forma de pago: 50% al inicio y 50% a la entrega.',
                'pieFacturaDefecto' => 'Gracias por confiar en KAIA. Inscrita en el Registro Mercantil.',
                'moneda' => 'EUR'
            ));
        }

        // Insert initial settings record if missing
        $settings_exists = $wpdb->get_var("SELECT COUNT(*) FROM {$prefix}settings");
        if (!$settings_exists) {
            $wpdb->insert("{$prefix}settings", array(
                'id' => 'SETTINGS_DEFAULT',
                'tema' => 'claro',
                'formatoFecha' => 'DD/MM/YYYY',
                'moneda' => 'EUR',
                'autoGuardar' => 1,
                'prefijoPresupuesto' => 'PRE',
                'prefijoFactura' => 'FAC',
                'prefijoProyecto' => 'PRO',
                'prefijoCliente' => 'CLI',
                'incluirAno' => 1,
                'digitosNumero' => 4,
                'separadorDecimal' => ','
            ));
        }
    }
}
