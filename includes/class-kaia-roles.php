<?php
/**
 * Roles and Capabilities Manager for KAIA
 */

if (!defined('ABSPATH')) {
    exit;
}

class KAIA_Roles {

    public static function get_capabilities() {
        return array(
            'kaia_view_dashboard'  => 'Ver Dashboard KAIA',
            'kaia_manage_clients'   => 'Gestionar Clientes',
            'kaia_view_clients'     => 'Ver Clientes',
            'kaia_manage_companies' => 'Gestionar Empresas',
            'kaia_view_companies'   => 'Ver Empresas',
            'kaia_manage_services'  => 'Gestionar Servicios',
            'kaia_view_services'    => 'Ver Servicios',
            'kaia_manage_domains'   => 'Gestionar Dominios',
            'kaia_view_domains'     => 'Ver Dominios',
            'kaia_manage_hosting'   => 'Gestionar Hosting',
            'kaia_view_hosting'     => 'Ver Hosting',
            'kaia_manage_projects'  => 'Gestionar Proyectos',
            'kaia_view_projects'    => 'Ver Proyectos',
            'kaia_manage_quotes'    => 'Gestionar Presupuestos',
            'kaia_view_quotes'      => 'Ver Presupuestos',
            'kaia_manage_invoices'  => 'Gestionar Facturas',
            'kaia_view_invoices'    => 'Ver Facturas',
            'kaia_manage_finances'  => 'Gestionar Finanzas',
            'kaia_view_finances'    => 'Ver Finanzas',
            'kaia_manage_documents' => 'Gestionar Documentos',
            'kaia_view_documents'   => 'Ver Documentos',
            'kaia_manage_leads'     => 'Gestionar Comercial',
            'kaia_view_leads'       => 'Ver Comercial',
            'kaia_manage_suppliers' => 'Gestionar Proveedores',
            'kaia_view_suppliers'   => 'Ver Proveedores',
            'kaia_manage_products'  => 'Gestionar Productos',
            'kaia_view_products'    => 'Ver Productos',
            'kaia_manage_users'     => 'Gestionar Usuarios KAIA',
            'kaia_manage_settings'  => 'Gestionar Configuración',
        );
    }

    public static function init() {
        // Run on every request to ensure capabilities exist on administrator
        self::ensure_admin_capabilities();
    }

    public static function add_roles_and_capabilities() {
        $caps = self::get_capabilities();

        // 1. Administrator (gets all kaia capabilities)
        $admin_role = get_role('administrator');
        if ($admin_role) {
            foreach (array_keys($caps) as $cap) {
                $admin_role->add_cap($cap);
            }
        }

        // 2. KAIA Administrador
        add_role('kaia_administrator', 'KAIA Administrador', array_fill_keys(array_keys($caps), true));

        // 3. KAIA Empleado (Default employee caps)
        $employee_caps = array(
            'read' => true,
            'kaia_view_dashboard' => true,
            'kaia_manage_clients' => true,
            'kaia_view_clients' => true,
            'kaia_manage_companies' => true,
            'kaia_view_companies' => true,
            'kaia_manage_services' => true,
            'kaia_view_services' => true,
            'kaia_manage_domains' => true,
            'kaia_view_domains' => true,
            'kaia_manage_hosting' => true,
            'kaia_view_hosting' => true,
            'kaia_manage_projects' => true,
            'kaia_view_projects' => true,
            'kaia_manage_quotes' => true,
            'kaia_view_quotes' => true,
            'kaia_manage_invoices' => true,
            'kaia_view_invoices' => true,
            'kaia_view_finances' => true,
            'kaia_manage_documents' => true,
            'kaia_view_documents' => true,
            'kaia_manage_leads' => true,
            'kaia_view_leads' => true,
            'kaia_manage_suppliers' => true,
            'kaia_view_suppliers' => true,
            'kaia_manage_products' => true,
            'kaia_view_products' => true,
        );
        add_role('kaia_employee', 'KAIA Empleado', $employee_caps);

        // 4. KAIA Cliente (Customer portal view caps)
        $client_caps = array(
            'read' => true,
            'kaia_view_dashboard' => true,
            'kaia_view_services' => true,
            'kaia_view_domains' => true,
            'kaia_view_hosting' => true,
            'kaia_view_projects' => true,
            'kaia_view_quotes' => true,
            'kaia_view_invoices' => true,
            'kaia_view_documents' => true,
        );
        add_role('kaia_client', 'KAIA Cliente', $client_caps);
    }

    public static function ensure_admin_capabilities() {
        if (current_user_can('administrator')) {
            $admin_role = get_role('administrator');
            if ($admin_role) {
                foreach (array_keys(self::get_capabilities()) as $cap) {
                    if (!$admin_role->has_cap($cap)) {
                        $admin_role->add_cap($cap);
                    }
                }
            }
        }
    }
}
