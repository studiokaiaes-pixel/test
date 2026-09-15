<?php
/**
 * App interface launcher and menu integration for KAIA
 */

if (!defined('ABSPATH')) {
    exit;
}

class KAIA_App {

    public static function init() {
        add_action('admin_menu', array(__CLASS__, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array(__CLASS__, 'enqueue_assets'));
        add_action('wp_enqueue_scripts', array(__CLASS__, 'enqueue_assets'));

        // Direct app page template hook
        add_action('init', array(__CLASS__, 'add_rewrite_rules'));
        add_filter('query_vars', array(__CLASS__, 'add_query_vars'));
        add_action('template_redirect', array(__CLASS__, 'render_standalone_app'));
    }

    public static function add_admin_menu() {
        add_menu_page(
            'KAIA Management',
            'KAIA',
            'kaia_view_dashboard',
            'kaia',
            array(__CLASS__, 'render_app'),
            'dashicons-chart-pie',
            2
        );
    }

    public static function add_rewrite_rules() {
        add_rewrite_rule('^kaia-app/?$', 'index.php?kaia_standalone=1', 'top');
    }

    public static function add_query_vars($vars) {
        $vars[] = 'kaia_standalone';
        return $vars;
    }

    public static function enqueue_assets($hook = '') {
        if ($hook !== 'toplevel_page_kaia' && $hook !== 'kaia_theme' && get_query_var('kaia_standalone') != '1' && !is_admin()) {
            // Enqueue on front-end if KAIA theme is active
            if (!current_theme_supports('kaia') && get_template() !== 'kaia') {
                return;
            }
        }

        // Clean default WP admin styles when inside KAIA admin page
        if ($hook === 'toplevel_page_kaia') {
            wp_add_inline_style('wp-admin', '
                #wpcontent { padding-left: 0 !important; }
                #wpbody-content { padding-bottom: 0 !important; }
                #wpfooter { display: none !important; }
                body.toplevel_page_kaia { background: #f5f5f5 !important; }
            ');
        }

        // Dynamically find Vite output files in dist/assets
        $dist_dir = KAIA_PLUGIN_DIR . 'dist/assets/';
        $dist_url = KAIA_PLUGIN_URL . 'dist/assets/';

        $css_file = '';
        $js_file = '';

        if (is_dir($dist_dir)) {
            $files = scandir($dist_dir);
            foreach ($files as $file) {
                if (pathinfo($file, PATHINFO_EXTENSION) === 'css') {
                    $css_file = $file;
                }
                if (pathinfo($file, PATHINFO_EXTENSION) === 'js' && strpos($file, 'index') === 0) {
                    $js_file = $file;
                }
            }
        }

        if ($css_file) {
            wp_enqueue_style('kaia-app-css', $dist_url . $css_file, array(), KAIA_VERSION);
        }

        if ($js_file) {
            wp_enqueue_script('kaia-app-js', $dist_url . $js_file, array(), KAIA_VERSION, true);
        }

        // Localize WP variables for JS
        $user = wp_get_current_user();
        wp_localize_script('kaia-app-js', 'kaiaWpApiSettings', array(
            'root'      => esc_url_raw(rest_url('kaia/v1/')),
            'nonce'     => wp_create_nonce('wp_rest'),
            'user'      => array(
                'id'          => $user->ID,
                'name'        => $user->display_name,
                'email'       => $user->user_email,
                'roles'       => $user->roles,
            ),
            'siteUrl'   => site_url(),
            'logoutUrl' => wp_logout_url(site_url()),
        ));
    }

    public static function render_app() {
        if (!is_user_logged_in()) {
            wp_redirect(wp_login_url());
            exit;
        }

        echo '<div id="kaia-app-root" class="kaia-container"></div>';
    }

    public static function render_standalone_app() {
        if (get_query_var('kaia_standalone') == '1') {
            if (!is_user_logged_in()) {
                auth_redirect();
                exit;
            }

            self::enqueue_assets('kaia_standalone');
            ?>
            <!DOCTYPE html>
            <html <?php language_attributes(); ?>>
            <head>
                <meta charset="<?php bloginfo('charset'); ?>">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>KAIA - Sistema de Gestión Empresarial</title>
                <?php wp_head(); ?>
            </head>
            <body class="bg-neutral-100 font-sans antialiased text-neutral-900">
                <?php self::render_app(); ?>
                <?php wp_footer(); ?>
            </body>
            </html>
            <?php
            exit;
        }
    }
}
