<?php
/**
 * REST API Controller for KAIA
 */

if (!defined('ABSPATH')) {
    exit;
}

class KAIA_REST_Controller extends WP_REST_Controller {

    protected $namespace = 'kaia/v1';

    private $allowed_columns = array(
        'clients' => array('id', 'wp_user_id', 'company_id', 'nombre', 'apellidos', 'empresa', 'cif', 'email', 'telefono', 'direccion', 'codigoPostal', 'ciudad', 'provincia', 'pais', 'notas', 'estado', 'fechaAlta', 'fechaModificacion', 'isDemo'),
        'services' => array('id', 'nombre', 'categoria', 'descripcion', 'precio', 'clienteId', 'empresaId', 'estado', 'fechaContratacion', 'fechaRenovacion', 'notas'),
        'domains' => array('id', 'dominio', 'clienteId', 'empresaId', 'proveedor', 'fechaAlta', 'fechaRenovacion', 'estado', 'coste', 'notas'),
        'hosting' => array('id', 'clienteId', 'empresaId', 'proveedor', 'servicio', 'plan', 'servidor', 'fechaContratacion', 'fechaRenovacion', 'coste', 'estado', 'notas'),
        'projects' => array('id', 'titulo', 'clienteId', 'empresaId', 'servicio', 'descripcion', 'estado', 'fechaInicio', 'fechaPrevista', 'importe', 'responsable', 'presupuestoId', 'notas', 'tareas_json', 'fechaCreacion', 'fechaModificacion', 'isDemo'),
        'quotes' => array('id', 'clienteId', 'empresaId', 'fecha', 'validez', 'estado', 'lineas_json', 'subtotal', 'descuentoTotal', 'ivaTotal', 'irpfTotal', 'total', 'condicionesPago', 'formaPago', 'plazoEntrega', 'revisiones', 'cancelacion', 'notas', 'observaciones', 'plantillaConfig_json', 'fechaCreacion', 'fechaModificacion', 'isDemo'),
        'invoices' => array('id', 'clienteId', 'empresaId', 'presupuestoId', 'proyectoId', 'fechaEmision', 'fechaVencimiento', 'formaPago', 'metodoPago', 'cuentaBancaria', 'lineas_json', 'pagos_json', 'baseImponible', 'ivaTotal', 'irpfTotal', 'total', 'importePagado', 'importePendiente', 'estado', 'notas', 'pieFactura', 'plantillaConfig_json', 'fechaCreacion', 'fechaModificacion', 'isDemo'),
        'finances' => array('id', 'fecha', 'tipo', 'categoria', 'descripcion', 'importe', 'metodo', 'estado', 'clienteId', 'empresaId', 'proyectoId', 'facturaId', 'fechaCreacion', 'isDemo'),
        'documents' => array('id', 'nombre', 'categoria', 'tamano', 'tipo', 'fechaSubida', 'clienteId', 'empresaId', 'proyectoId', 'servicioId', 'url', 'notas', 'isDemo'),
        'leads' => array('id', 'empresa', 'contacto', 'email', 'telefono', 'origen', 'servicioInteres', 'estado', 'fase', 'valorEstimado', 'probabilidad', 'responsable', 'proximoPaso', 'fechaContacto', 'proximoSeguimiento', 'fechaPrevistaCierre', 'clienteId', 'empresaId', 'notas', 'fechaCreacion', 'isDemo'),
        'suppliers' => array('id', 'proveedor', 'empresa', 'cif', 'contacto', 'email', 'telefono', 'web', 'servicio', 'condiciones', 'direccion', 'iban', 'estado', 'notas', 'fechaCreacion', 'fechaModificacion', 'isDemo'),
        'products' => array('id', 'codigo', 'nombre', 'referencia', 'categoria', 'descripcion', 'precio', 'iva', 'unidad', 'stock', 'stockMinimo', 'proveedorId', 'estado', 'fechaCreacion', 'fechaModificacion', 'isDemo'),
        'activities' => array('id', 'fecha', 'descripcion', 'tipo', 'entidadId', 'targetView', 'targetId', 'usuario')
    );

    public function register_routes() {
        register_rest_route($this->namespace, '/state', array(
            'methods'  => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_state'),
            'permission_callback' => array($this, 'check_read_permission'),
        ));

        $resources = array(
            'companies', 'clients', 'services', 'domains', 'hosting',
            'projects', 'quotes', 'invoices', 'finances', 'documents',
            'leads', 'suppliers', 'products', 'activities', 'settings', 'users'
        );

        foreach ($resources as $resource) {
            register_rest_route($this->namespace, '/' . $resource, array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array($this, 'get_items'),
                    'permission_callback' => array($this, 'check_read_permission'),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array($this, 'create_or_update_item'),
                    'permission_callback' => array($this, 'check_write_permission'),
                ),
            ));

            register_rest_route($this->namespace, '/' . $resource . '/(?P<id>[a-zA-Z0-9_\-]+)', array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array($this, 'get_item'),
                    'permission_callback' => array($this, 'check_read_permission'),
                ),
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array($this, 'create_or_update_item'),
                    'permission_callback' => array($this, 'check_write_permission'),
                ),
                array(
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => array($this, 'delete_item'),
                    'permission_callback' => array($this, 'check_write_permission'),
                ),
            ));
        }

        register_rest_route($this->namespace, '/invoices/(?P<id>[a-zA-Z0-9_\-]+)/payments', array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'add_invoice_payment'),
            'permission_callback' => array($this, 'check_write_permission'),
        ));
    }

    public function check_read_permission($request) {
        if (!is_user_logged_in()) {
            return new WP_Error('rest_forbidden', 'Debes iniciar sesión para acceder a KAIA.', array('status' => 401));
        }

        $user = wp_get_current_user();
        if (in_array('administrator', (array)$user->roles) ||
            in_array('kaia_administrator', (array)$user->roles) ||
            in_array('kaia_employee', (array)$user->roles) ||
            in_array('kaia_client', (array)$user->roles) ||
            current_user_can('kaia_view_dashboard')) {
            return true;
        }

        return new WP_Error('rest_forbidden', 'No tienes permisos suficientes.', array('status' => 403));
    }

    public function check_write_permission($request) {
        if (!is_user_logged_in()) {
            return new WP_Error('rest_forbidden', 'Debes iniciar sesión.', array('status' => 401));
        }

        $user = wp_get_current_user();
        if (in_array('kaia_client', (array)$user->roles) && !current_user_can('administrator')) {
            return new WP_Error('rest_forbidden', 'Los clientes no tienen permisos de escritura.', array('status' => 403));
        }

        $path = trim($request->get_route(), '/');
        $parts = explode('/', $path);
        $resource = $parts[2] ?? '';

        $cap_map = array(
            'clients'    => 'kaia_manage_clients',
            'services'   => 'kaia_manage_services',
            'domains'    => 'kaia_manage_domains',
            'hosting'    => 'kaia_manage_hosting',
            'projects'   => 'kaia_manage_projects',
            'quotes'     => 'kaia_manage_quotes',
            'invoices'   => 'kaia_manage_invoices',
            'finances'   => 'kaia_manage_finances',
            'documents'  => 'kaia_manage_documents',
            'leads'      => 'kaia_manage_leads',
            'suppliers'  => 'kaia_manage_suppliers',
            'products'   => 'kaia_manage_products',
            'companies'  => 'kaia_manage_companies',
            'company'    => 'kaia_manage_companies',
            'settings'   => 'kaia_manage_settings',
            'users'      => 'kaia_manage_users',
        );

        if (current_user_can('administrator') || current_user_can('kaia_administrator')) {
            return true;
        }

        if (isset($cap_map[$resource]) && current_user_can($cap_map[$resource])) {
            return true;
        }

        if (current_user_can('kaia_view_dashboard') && in_array('kaia_employee', (array)$user->roles)) {
            return true;
        }

        return new WP_Error('rest_forbidden', 'No tienes permisos de modificación.', array('status' => 403));
    }

    private function get_current_client_id() {
        global $wpdb;
        $user_id = get_current_user_id();
        $prefix = KAIA_DB::get_table_prefix();
        return $wpdb->get_var($wpdb->prepare("SELECT id FROM {$prefix}clients WHERE wp_user_id = %d", $user_id));
    }

    private function parse_json($value) {
        if (empty($value)) return array();
        if (is_array($value) || is_object($value)) return $value;
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : array();
    }

    public function get_state($request) {
        global $wpdb;
        $prefix = KAIA_DB::get_table_prefix();

        $user = wp_get_current_user();
        $is_client = in_array('kaia_client', (array)$user->roles) && !current_user_can('administrator') && !current_user_can('kaia_administrator');
        $client_id = $is_client ? $this->get_current_client_id() : null;

        // Company
        $company = $wpdb->get_row("SELECT * FROM {$prefix}companies LIMIT 1", ARRAY_A);
        if ($company) {
            $company['ivaPorDefecto'] = (float)$company['ivaPorDefecto'];
            $company['retencionIRPF'] = (float)$company['retencionIRPF'];
        }

        // Settings
        $settings = $wpdb->get_row("SELECT * FROM {$prefix}settings LIMIT 1", ARRAY_A);
        if ($settings) {
            $settings['autoGuardar'] = (bool)$settings['autoGuardar'];
            $settings['incluirAno'] = (bool)$settings['incluirAno'];
            $settings['digitosNumero'] = (int)$settings['digitosNumero'];
            if (!empty($settings['plantillaPresupuestoDefecto_json'])) {
                $settings['plantillaPresupuestoDefecto'] = $this->parse_json($settings['plantillaPresupuestoDefecto_json']);
            }
            if (!empty($settings['plantillaFacturaDefecto_json'])) {
                $settings['plantillaFacturaDefecto'] = $this->parse_json($settings['plantillaFacturaDefecto_json']);
            }
        }

        if ($is_client) {
            // STRICT ISOLATION: If $client_id is empty, return empty arrays for client restricted resources
            if (empty($client_id)) {
                $clients = array();
                $services = array();
                $domains = array();
                $hosting = array();
                $projects = array();
                $quotes = array();
                $invoices = array();
                $documents = array();
            } else {
                $clients = $wpdb->get_results($wpdb->prepare("SELECT * FROM {$prefix}clients WHERE id = %s", $client_id), ARRAY_A);
                $services = $wpdb->get_results($wpdb->prepare("SELECT * FROM {$prefix}services WHERE clienteId = %s", $client_id), ARRAY_A);
                $domains = $wpdb->get_results($wpdb->prepare("SELECT * FROM {$prefix}domains WHERE clienteId = %s", $client_id), ARRAY_A);
                $hosting = $wpdb->get_results($wpdb->prepare("SELECT * FROM {$prefix}hosting WHERE clienteId = %s", $client_id), ARRAY_A);
                $projects = $wpdb->get_results($wpdb->prepare("SELECT * FROM {$prefix}projects WHERE clienteId = %s", $client_id), ARRAY_A);
                $quotes = $wpdb->get_results($wpdb->prepare("SELECT * FROM {$prefix}quotes WHERE clienteId = %s", $client_id), ARRAY_A);
                $invoices = $wpdb->get_results($wpdb->prepare("SELECT * FROM {$prefix}invoices WHERE clienteId = %s", $client_id), ARRAY_A);
                $documents = $wpdb->get_results($wpdb->prepare("SELECT * FROM {$prefix}documents WHERE clienteId = %s", $client_id), ARRAY_A);
            }
        } else {
            $clients = $wpdb->get_results("SELECT * FROM {$prefix}clients ORDER BY created_at DESC", ARRAY_A);
            $services = $wpdb->get_results("SELECT * FROM {$prefix}services ORDER BY created_at DESC", ARRAY_A);
            $domains = $wpdb->get_results("SELECT * FROM {$prefix}domains ORDER BY created_at DESC", ARRAY_A);
            $hosting = $wpdb->get_results("SELECT * FROM {$prefix}hosting ORDER BY created_at DESC", ARRAY_A);
            $projects = $wpdb->get_results("SELECT * FROM {$prefix}projects ORDER BY created_at DESC", ARRAY_A);
            $quotes = $wpdb->get_results("SELECT * FROM {$prefix}quotes ORDER BY created_at DESC", ARRAY_A);
            $invoices = $wpdb->get_results("SELECT * FROM {$prefix}invoices ORDER BY created_at DESC", ARRAY_A);
            $documents = $wpdb->get_results("SELECT * FROM {$prefix}documents ORDER BY created_at DESC", ARRAY_A);
        }

        foreach ($clients as &$c) { $c['isDemo'] = (bool)($c['isDemo'] ?? false); }
        foreach ($services as &$s) { $s['precio'] = (float)$s['precio']; }
        foreach ($domains as &$d) { $d['coste'] = (float)$d['coste']; }
        foreach ($hosting as &$h) { $h['coste'] = (float)$h['coste']; }
        foreach ($projects as &$p) {
            $p['importe'] = (float)$p['importe'];
            $p['tareas'] = $this->parse_json($p['tareas_json'] ?? '[]');
            $p['isDemo'] = (bool)($p['isDemo'] ?? false);
        }
        foreach ($quotes as &$q) {
            $q['subtotal'] = (float)$q['subtotal'];
            $q['descuentoTotal'] = (float)$q['descuentoTotal'];
            $q['ivaTotal'] = (float)$q['ivaTotal'];
            $q['irpfTotal'] = (float)($q['irpfTotal'] ?? 0);
            $q['total'] = (float)$q['total'];
            $q['lineas'] = $this->parse_json($q['lineas_json'] ?? '[]');
            $q['plantillaConfig'] = $this->parse_json($q['plantillaConfig_json'] ?? '{}');
            $q['isDemo'] = (bool)($q['isDemo'] ?? false);
        }
        foreach ($invoices as &$inv) {
            $inv['baseImponible'] = (float)$inv['baseImponible'];
            $inv['ivaTotal'] = (float)$inv['ivaTotal'];
            $inv['irpfTotal'] = (float)($inv['irpfTotal'] ?? 0);
            $inv['total'] = (float)$inv['total'];
            $inv['importePagado'] = (float)$inv['importePagado'];
            $inv['importePendiente'] = (float)$inv['importePendiente'];
            $inv['lineas'] = $this->parse_json($inv['lineas_json'] ?? '[]');
            $inv['pagos'] = $this->parse_json($inv['pagos_json'] ?? '[]');
            $inv['plantillaConfig'] = $this->parse_json($inv['plantillaConfig_json'] ?? '{}');
            $inv['isDemo'] = (bool)($inv['isDemo'] ?? false);
        }

        // Finances (Hidden for clients)
        $finances = array();
        if (!$is_client) {
            $finances = $wpdb->get_results("SELECT * FROM {$prefix}finances ORDER BY created_at DESC", ARRAY_A);
            foreach ($finances as &$f) {
                $f['importe'] = (float)$f['importe'];
                $f['isDemo'] = (bool)($f['isDemo'] ?? false);
            }
        }

        // Leads
        $leads = array();
        if (!$is_client) {
            $leads = $wpdb->get_results("SELECT * FROM {$prefix}leads ORDER BY created_at DESC", ARRAY_A);
            foreach ($leads as &$l) {
                $l['valorEstimado'] = (float)$l['valorEstimado'];
                $l['probabilidad'] = (float)($l['probabilidad'] ?? 50);
            }
        }

        // Suppliers
        $suppliers = array();
        if (!$is_client) {
            $suppliers = $wpdb->get_results("SELECT * FROM {$prefix}suppliers ORDER BY created_at DESC", ARRAY_A);
        }

        // Products
        $products = $wpdb->get_results("SELECT * FROM {$prefix}products ORDER BY created_at DESC", ARRAY_A);
        foreach ($products as &$pr) {
            $pr['precio'] = (float)$pr['precio'];
            $pr['iva'] = (float)$pr['iva'];
            $pr['stock'] = (int)$pr['stock'];
            $pr['stockMinimo'] = (int)$pr['stockMinimo'];
        }

        // Activities
        $activities = $wpdb->get_results("SELECT * FROM {$prefix}activities ORDER BY created_at DESC LIMIT 100", ARRAY_A);

        return rest_ensure_response(array(
            'company'    => $company ?: new stdClass(),
            'settings'   => $settings ?: new stdClass(),
            'clients'    => $clients,
            'services'   => $services,
            'domains'    => $domains,
            'hosting'    => $hosting,
            'projects'   => $projects,
            'quotes'     => $quotes,
            'invoices'   => $invoices,
            'finances'   => $finances,
            'documents'  => $documents,
            'leads'      => $leads,
            'commercial' => $leads,
            'suppliers'  => $suppliers,
            'products'   => $products,
            'activities' => $activities,
            'user'       => array(
                'id'           => $user->ID,
                'name'         => $user->display_name,
                'email'        => $user->user_email,
                'roles'        => $user->roles,
                'isClient'     => $is_client,
                'kaiaClientId' => $client_id
            )
        ));
    }

    public function get_items($request) {
        return $this->get_state($request);
    }

    public function get_item($request) {
        $state = $this->get_state($request)->get_data();
        $id = $request['id'];

        foreach ($state as $key => $items) {
            if (is_array($items)) {
                foreach ($items as $item) {
                    if (is_array($item) && isset($item['id']) && $item['id'] === $id) {
                        return rest_ensure_response($item);
                    }
                }
            }
        }

        return new WP_Error('not_found', 'Elemento no encontrado', array('status' => 404));
    }

    public function create_or_update_item($request) {
        global $wpdb;
        $prefix = KAIA_DB::get_table_prefix();
        $params = $request->get_json_params() ?: $request->get_params();

        $path = trim($request->get_route(), '/');
        $parts = explode('/', $path);
        $resource = $parts[2] ?? '';

        if (empty($resource)) {
            return new WP_Error('invalid_resource', 'Recurso no válido', array('status' => 400));
        }

        // Strict Capability Check for User Management
        if ($resource === 'users') {
            if (!current_user_can('administrator') && !current_user_can('kaia_manage_users')) {
                return new WP_Error('rest_forbidden', 'Se requieren permisos de administración de usuarios.', array('status' => 403));
            }

            $username = sanitize_user($params['username'] ?? '');
            $email = sanitize_email($params['email'] ?? '');
            $password = $params['password'] ?? '';
            $role = sanitize_text_field($params['role'] ?? 'kaia_employee');
            $display_name = sanitize_text_field($params['name'] ?? $username);

            if (empty($username) || empty($email)) {
                return new WP_Error('missing_fields', 'Nombre de usuario y email requeridos', array('status' => 400));
            }

            if (!empty($params['id']) && is_numeric($params['id'])) {
                $user_id = intval($params['id']);
                $update_data = array('ID' => $user_id, 'display_name' => $display_name, 'user_email' => $email);
                if (!empty($password)) {
                    $update_data['user_pass'] = $password;
                }
                wp_update_user($update_data);
                $u = new WP_User($user_id);
                $u->set_role($role);
            } else {
                if (username_exists($username) || email_exists($email)) {
                    return new WP_Error('user_exists', 'El usuario o email ya existe', array('status' => 400));
                }
                $user_id = wp_create_user($username, $password ?: wp_generate_password(), $email);
                if (is_wp_error($user_id)) {
                    return $user_id;
                }
                $u = new WP_User($user_id);
                $u->set_role($role);
                wp_update_user(array('ID' => $user_id, 'display_name' => $display_name));
            }

            return rest_ensure_response(array('success' => true, 'id' => $user_id));
        }

        // Special handling for settings
        if ($resource === 'settings') {
            if (!current_user_can('administrator') && !current_user_can('kaia_manage_settings')) {
                return new WP_Error('rest_forbidden', 'Se requieren permisos para cambiar la configuración.', array('status' => 403));
            }
            $data = array(
                'tema' => sanitize_text_field($params['tema'] ?? 'claro'),
                'formatoFecha' => sanitize_text_field($params['formatoFecha'] ?? 'DD/MM/YYYY'),
                'moneda' => sanitize_text_field($params['moneda'] ?? 'EUR'),
                'autoGuardar' => !empty($params['autoGuardar']) ? 1 : 0,
                'prefijoPresupuesto' => sanitize_text_field($params['prefijoPresupuesto'] ?? 'PRE'),
                'prefijoFactura' => sanitize_text_field($params['prefijoFactura'] ?? 'FAC'),
                'prefijoProyecto' => sanitize_text_field($params['prefijoProyecto'] ?? 'PRO'),
                'prefijoCliente' => sanitize_text_field($params['prefijoCliente'] ?? 'CLI'),
                'incluirAno' => !empty($params['incluirAno']) ? 1 : 0,
                'digitosNumero' => intval($params['digitosNumero'] ?? 4),
                'separadorDecimal' => sanitize_text_field($params['separadorDecimal'] ?? ','),
                'plantillaPresupuestoDefecto_json' => wp_json_encode($params['plantillaPresupuestoDefecto'] ?? array()),
                'plantillaFacturaDefecto_json' => wp_json_encode($params['plantillaFacturaDefecto'] ?? array())
            );
            $wpdb->update("{$prefix}settings", $data, array('id' => 'SETTINGS_DEFAULT'));
            return rest_ensure_response(array('success' => true));
        }

        // Special handling for company
        if ($resource === 'companies' || $resource === 'company') {
            if (!current_user_can('administrator') && !current_user_can('kaia_manage_companies')) {
                return new WP_Error('rest_forbidden', 'Se requieren permisos de gestión de empresa.', array('status' => 403));
            }
            $data = array(
                'nombreComercial' => sanitize_text_field($params['nombreComercial'] ?? ''),
                'razonSocial' => sanitize_text_field($params['razonSocial'] ?? ''),
                'cif' => sanitize_text_field($params['cif'] ?? ''),
                'direccion' => sanitize_textarea_field($params['direccion'] ?? ''),
                'codigoPostal' => sanitize_text_field($params['codigoPostal'] ?? ''),
                'ciudad' => sanitize_text_field($params['ciudad'] ?? ''),
                'provincia' => sanitize_text_field($params['provincia'] ?? ''),
                'pais' => sanitize_text_field($params['pais'] ?? 'España'),
                'telefono' => sanitize_text_field($params['telefono'] ?? ''),
                'email' => sanitize_email($params['email'] ?? ''),
                'web' => sanitize_text_field($params['web'] ?? ''),
                'iban' => sanitize_text_field($params['iban'] ?? ''),
                'banco' => sanitize_text_field($params['banco'] ?? ''),
                'swift' => sanitize_text_field($params['swift'] ?? ''),
                'condicionesPago' => sanitize_textarea_field($params['condicionesPago'] ?? ''),
                'ivaPorDefecto' => floatval($params['ivaPorDefecto'] ?? 21),
                'retencionIRPF' => floatval($params['retencionIRPF'] ?? 0),
                'cuentaBancaria' => sanitize_text_field($params['cuentaBancaria'] ?? ''),
                'registroMercantil' => sanitize_textarea_field($params['registroMercantil'] ?? ''),
                'condicionesDefecto' => sanitize_textarea_field($params['condicionesDefecto'] ?? ''),
                'pieFacturaDefecto' => sanitize_textarea_field($params['pieFacturaDefecto'] ?? ''),
                'moneda' => sanitize_text_field($params['moneda'] ?? 'EUR')
            );
            $wpdb->update("{$prefix}companies", $data, array('id' => 'COMPANY_DEFAULT'));
            return rest_ensure_response(array('success' => true));
        }

        // Generic Table Mapping
        $table_map = array(
            'clients'    => 'clients',
            'services'   => 'services',
            'domains'    => 'domains',
            'hosting'    => 'hosting',
            'projects'   => 'projects',
            'quotes'     => 'quotes',
            'invoices'   => 'invoices',
            'finances'   => 'finances',
            'documents'  => 'documents',
            'leads'      => 'leads',
            'commercial' => 'leads',
            'suppliers'  => 'suppliers',
            'products'   => 'products',
            'activities' => 'activities'
        );

        if (!isset($table_map[$resource])) {
            return new WP_Error('unsupported_resource', 'Recurso no soportado', array('status' => 400));
        }

        $table_key = $table_map[$resource];
        $table = $prefix . $table_key;
        $id = sanitize_text_field($params['id'] ?? '');

        if (empty($id)) {
            return new WP_Error('missing_id', 'ID requerido', array('status' => 400));
        }

        $valid_columns = $this->allowed_columns[$table_key] ?? array();
        $data = array();

        foreach ($params as $k => $v) {
            $db_key = $k;
            if ($k === 'lineas' || $k === 'pagos' || $k === 'tareas' || $k === 'plantillaConfig') {
                $db_key = $k . '_json';
                $v = wp_json_encode($v);
            } else if (is_array($v) || is_object($v)) {
                $db_key = $k . '_json';
                $v = wp_json_encode($v);
            }

            if (in_array($db_key, $valid_columns, true)) {
                if (is_bool($v)) {
                    $data[$db_key] = $v ? 1 : 0;
                } else {
                    $data[$db_key] = is_string($v) ? sanitize_text_field($v) : $v;
                }
            }
        }

        $exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$table} WHERE id = %s", $id));

        if ($exists) {
            $wpdb->update($table, $data, array('id' => $id));
        } else {
            $wpdb->insert($table, $data);
        }

        // Log activity
        $wpdb->insert("{$prefix}activities", array(
            'id'          => 'ACT-' . time() . '-' . rand(100, 999),
            'fecha'       => date('Y-m-d H:i'),
            'descripcion' => "Guardado en {$resource}: {$id}",
            'tipo'        => $resource,
            'entidadId'   => $id,
            'usuario'     => wp_get_current_user()->display_name
        ));

        return rest_ensure_response(array('success' => true, 'id' => $id));
    }

    public function delete_item($request) {
        global $wpdb;
        $prefix = KAIA_DB::get_table_prefix();
        $id = sanitize_text_field($request['id']);

        $path = trim($request->get_route(), '/');
        $parts = explode('/', $path);
        $resource = $parts[2] ?? '';

        if ($resource === 'users') {
            if (!current_user_can('administrator') && !current_user_can('kaia_manage_users')) {
                return new WP_Error('rest_forbidden', 'Se requieren permisos para eliminar usuarios.', array('status' => 403));
            }
            wp_delete_user(intval($id));
            return rest_ensure_response(array('success' => true, 'id' => $id));
        }

        $table_map = array(
            'clients'    => 'clients',
            'services'   => 'services',
            'domains'    => 'domains',
            'hosting'    => 'hosting',
            'projects'   => 'projects',
            'quotes'     => 'quotes',
            'invoices'   => 'invoices',
            'finances'   => 'finances',
            'documents'  => 'documents',
            'leads'      => 'leads',
            'commercial' => 'leads',
            'suppliers'  => 'suppliers',
            'products'   => 'products',
            'activities' => 'activities'
        );

        if (!isset($table_map[$resource])) {
            return new WP_Error('unsupported_resource', 'Recurso no soportado', array('status' => 400));
        }

        $table = $prefix . $table_map[$resource];
        $wpdb->delete($table, array('id' => $id));

        return rest_ensure_response(array('success' => true, 'id' => $id));
    }

    public function add_invoice_payment($request) {
        global $wpdb;
        $prefix = KAIA_DB::get_table_prefix();
        $invoice_id = sanitize_text_field($request['id']);
        $payment = $request->get_json_params();

        $invoice = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$prefix}invoices WHERE id = %s", $invoice_id), ARRAY_A);
        if (!$invoice) {
            return new WP_Error('not_found', 'Factura no encontrada', array('status' => 404));
        }

        $pagos = $this->parse_json($invoice['pagos_json'] ?? '[]');
        $pagos[] = $payment;

        $total_pagado = 0;
        foreach ($pagos as $p) {
            $total_pagado += floatval($p['importe'] ?? 0);
        }

        $total = floatval($invoice['total']);
        $pendiente = max(0, $total - $total_pagado);

        $nuevo_estado = $invoice['estado'];
        if ($pendiente <= 0.01) {
            $nuevo_estado = 'Pagada';
        } else if ($total_pagado > 0) {
            $nuevo_estado = 'Parcial';
        }

        $wpdb->update("{$prefix}invoices", array(
            'pagos_json'       => wp_json_encode($pagos),
            'importePagado'    => $total_pagado,
            'importePendiente' => $pendiente,
            'estado'           => $nuevo_estado,
            'fechaModificacion' => date('Y-m-d')
        ), array('id' => $invoice_id));

        $wpdb->insert("{$prefix}finances", array(
            'id'            => 'MOV-' . time() . '-' . rand(10, 99),
            'fecha'         => sanitize_text_field($payment['fecha'] ?? date('Y-m-d')),
            'tipo'          => 'Ingreso',
            'categoria'     => 'Cobro de Facturas',
            'descripcion'   => "Cobro {$invoice_id} - Ref: " . sanitize_text_field($payment['referencia'] ?? 'S/R'),
            'importe'       => floatval($payment['importe']),
            'metodo'        => sanitize_text_field($payment['metodo'] ?? 'Transferencia'),
            'estado'        => 'Completado',
            'clienteId'     => $invoice['clienteId'],
            'proyectoId'    => $invoice['proyectoId'],
            'facturaId'     => $invoice_id,
            'fechaCreacion' => date('Y-m-d')
        ));

        return rest_ensure_response(array('success' => true, 'invoiceId' => $invoice_id, 'estado' => $nuevo_estado));
    }
}
