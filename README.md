# KAIA - Sistema de Gestión Empresarial Integrado en WordPress

**KAIA** es un plugin profesional de gestión empresarial (ERP/CRM) diseñado para ejecutarse sobre **WordPress**. Proporciona un panel privado de control independiente, moderno y responsivo para gestionar clientes, empresas, servicios, dominios, hosting, proyectos, presupuestos, facturas, finanzas, documentos, oportunidades comerciales, proveedores y productos.

---

## 🚀 Requisitos e Instalación

1. **WordPress**: Versión 5.8 o superior (compatible con WordPress estándar).
2. **PHP**: 7.4 u 8.x (PHP 8.3 probado y recomendado).
3. **Paso 1**: Descarga o copia la carpeta `kaia` directamente en `wp-content/plugins/`.
4. **Paso 2**: Activa el plugin **KAIA** desde el panel de administración de WordPress (`Plugins -> Plugins instalados`).
5. **Paso 3**: Al activarse, KAIA creará automáticamente sus tablas personalizadas mediante el objeto `$wpdb` y registrará los roles y permisos de acceso.
6. **Paso 4**: Accede al panel de control desde el menú principal de WordPress en el enlace **KAIA** o navegando a `your-site.com/kaia-app`.

---

## 📁 Estructura del Plugin

```
kaia/
├── kaia.php                          # Archivo principal y cabecera del plugin WordPress
├── database/
│   └── class-kaia-db.php             # Instalador y esquema relacional ($wpdb)
├── includes/
│   ├── class-kaia-roles.php          # Definición de roles (Admin, Empleado, Cliente) y capabilities
│   └── class-kaia-app.php            # Renderizado de la aplicación y encolado de assets
├── api/
│   └── class-kaia-rest-controller.php# Controlador de WP REST API (/wp-json/kaia/v1/)
├── dist/                             # Compilación optimizada del panel de control
│   └── assets/                       # JavaScript y CSS empaquetados por Vite
├── src/                              # Código fuente frontend (React + TypeScript + Tailwind CSS)
│   ├── App.tsx                       # Componente principal y enrutado de vistas
│   ├── types/                        # Definiciones de datos y modelos de la aplicación
│   ├── services/                     # Servicio de comunicación e integración con WP REST API
│   ├── pages/                        # Módulos de interfaz (Clientes, Servicios, Dominios, Hosting...)
│   └── components/                   # Componentes reutilizables, modales y tablas
├── package.json                      # Configuración de compilación Vite y frontend
└── README.md                         # Documentación oficial del proyecto
```

---

## 🗄️ Esquema de Base de Datos ($wpdb)

KAIA no utiliza SQLite ni almacena JSON gigantescos como sustituto relacional. En su lugar, utiliza tablas personalizadas creadas en la base de datos de WordPress utilizando el prefijo configurado (`wp_kaia_*`):

- `wp_kaia_companies`: Datos fiscales de la empresa principal.
- `wp_kaia_clients`: Ficha completa de clientes asociada opcionalmente a un usuario de WordPress (`wp_user_id`).
- `wp_kaia_services`: Registro de servicios recurrentes y contratados.
- `wp_kaia_domains`: Dominios, registrador, costes y fechas de renovación con alertas visuales.
- `wp_kaia_hosting`: Servidores, proveedores, planes de alojamiento y vencimientos.
- `wp_kaia_projects`: Gestión de proyectos con desglose de tareas e importes.
- `wp_kaia_quotes`: Presupuestos emitidos, líneas de detalle, impuestos y estados.
- `wp_kaia_invoices`: Facturación con registro de cobros parciales o totales y vinculación financiera.
- `wp_kaia_finances`: Registro de movimientos de caja (ingresos y gastos).
- `wp_kaia_documents`: Repositorio documental filtrado por cliente/proyecto.
- `wp_kaia_leads`: Oportunidades comerciales y embudo de ventas.
- `wp_kaia_suppliers`: Proveedores y condiciones comerciales.
- `wp_kaia_products`: Catálogo de productos y servicios precargables.
- `wp_kaia_activities`: Registro auditado de actividad.
- `wp_kaia_settings`: Configuración de prefijos, formato de fecha, moneda e impuestos.

---

## 🔐 Roles, Permisos y Seguridad

El plugin integra un control de acceso basado en los roles y *capabilities* de WordPress:

### Roles creados
1. **KAIA Administrador (`kaia_administrator` / `administrator`)**:
   - Acceso absoluto a todos los módulos, ajustes y gestión de usuarios.
2. **KAIA Empleado (`kaia_employee`)**:
   - Acceso operativo a Clientes, Servicios, Dominios, Hosting, Proyectos y Documentos.
3. **KAIA Cliente (`kaia_client`)**:
   - Acceso restringido exclusivamente a **sus propios datos** (sus proyectos, facturas, presupuestos, servicios y dominios contratados).

### Capabilities personalizadas:
- `kaia_view_dashboard`
- `kaia_manage_clients` / `kaia_view_clients`
- `kaia_manage_companies` / `kaia_view_companies`
- `kaia_manage_services` / `kaia_view_services`
- `kaia_manage_domains` / `kaia_view_domains`
- `kaia_manage_hosting` / `kaia_view_hosting`
- `kaia_manage_projects` / `kaia_view_projects`
- `kaia_manage_quotes` / `kaia_view_quotes`
- `kaia_manage_invoices` / `kaia_view_invoices`
- `kaia_manage_finances` / `kaia_view_finances`
- `kaia_manage_documents` / `kaia_view_documents`
- `kaia_manage_leads` / `kaia_view_leads`
- `kaia_manage_suppliers` / `kaia_view_suppliers`
- `kaia_manage_products` / `kaia_view_products`
- `kaia_manage_users`
- `kaia_manage_settings`

### Buenas prácticas de seguridad aplicadas:
- Validación de **Nonces** en peticiones REST (`wp_rest`).
- Sanitización de entradas con `sanitize_text_field`, `sanitize_email`, `sanitize_user` y `sanitize_textarea_field`.
- Consultas preparadas en `$wpdb->prepare()`.
- Control estricto en la API REST donde los usuarios con rol de cliente solo reciben registros filtrados por su `clienteId` de forma transparente en el backend, previniendo acceso directo a información de terceros.
- Eliminación total de APIs externas de Inteligencia Artificial (IA) y entornos de escritorio Electron.

---

## 🛠️ Desarrollo y Compilación

Si deseas modificar el código fuente de la interfaz React:

1. Modifica los archivos situados en la carpeta `src/`.
2. Ejecuta el comando de compilación:
   ```bash
   npm run build
   ```
3. Los assets de producción se generarán automáticamente en `dist/assets/` y el plugin de WordPress los cargará en tiempo de ejecución.

---

## ✅ Pruebas Realizadas

- Instalación, activación y deconstrucción mediante hooks de WordPress.
- Verificación del instalador de tablas relacionales en MySQL/MariaDB mediante `$wpdb`.
- Validación de peticiones REST API con verificación de Nonces y token de sesión.
- Control de aislamiento de seguridad para clientes impidiendo consultas transversales.
- Generación y descarga de documentos en formato PDF de presupuestos y facturas mediante `html2canvas` y `jsPDF`.
- Compilación de producción con comprobación estricta de tipos (`tsc`) y sintaxis PHP (`php -l`).

---

## 📄 Licencia

Licencia GPL v2 o posterior.
