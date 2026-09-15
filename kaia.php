<?php
/**
 * Plugin Name: KAIA - Sistema de Gestión Empresarial
 * Plugin URI:  https://kaia-app.com
 * Description: Sistema integral de gestión empresarial para WordPress (Clientes, Empresas, Servicios, Dominios, Hosting, Proyectos, Presupuestos, Facturas, Documentos).
 * Version:     2.0.0
 * Author:      KAIA Team
 * Text Domain: kaia
 * Domain Path: /languages
 * License:     GPL-2.0+
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

define('KAIA_VERSION', '2.0.0');

// Calculate directory and URL dynamically whether loaded as Theme or Plugin
$kaia_dir = plugin_dir_path(__FILE__);
$kaia_url = plugin_dir_url(__FILE__);

if (function_exists('get_template_directory') && strpos(__FILE__, get_template_directory()) !== false) {
    $kaia_dir = get_template_directory() . '/';
    $kaia_url = get_template_directory_uri() . '/';
}

define('KAIA_PLUGIN_DIR', $kaia_dir);
define('KAIA_PLUGIN_URL', $kaia_url);
define('KAIA_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Require core class files
require_once KAIA_PLUGIN_DIR . 'database/class-kaia-db.php';
require_once KAIA_PLUGIN_DIR . 'includes/class-kaia-roles.php';
require_once KAIA_PLUGIN_DIR . 'includes/class-kaia-app.php';
require_once KAIA_PLUGIN_DIR . 'api/class-kaia-rest-controller.php';

/**
 * Main Plugin Class
 */
final class KAIA {
    private static $instance = null;

    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->init_hooks();
    }

    private function init_hooks() {
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));

        if (did_action('plugins_loaded')) {
            $this->init_plugin();
        } else {
            add_action('plugins_loaded', array($this, 'init_plugin'));
        }
    }

    public function init_plugin() {
        // Initialize roles
        KAIA_Roles::init();

        // Initialize REST API
        if (did_action('rest_api_init')) {
            $controller = new KAIA_REST_Controller();
            $controller->register_routes();
        } else {
            add_action('rest_api_init', function() {
                $controller = new KAIA_REST_Controller();
                $controller->register_routes();
            });
        }

        // Initialize App UI
        KAIA_App::init();
    }

    public function activate() {
        KAIA_DB::install();
        KAIA_Roles::add_roles_and_capabilities();
        flush_rewrite_rules();
    }

    public function deactivate() {
        flush_rewrite_rules();
    }
}

// Instantiate plugin
function kaia() {
    return KAIA::instance();
}

kaia();
