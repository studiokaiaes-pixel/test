<?php
/**
 * KAIA Theme Functions
 */

if (!defined('ABSPATH')) {
    exit;
}

// Include KAIA engine
require_once get_template_directory() . '/kaia.php';

// Force initialize KAIA engine in theme lifecycle
kaia()->init_plugin();

// Trigger database installer and roles creation upon theme activation
add_action('after_switch_theme', function() {
    if (class_exists('KAIA_DB')) {
        KAIA_DB::install();
    }
    if (class_exists('KAIA_Roles')) {
        KAIA_Roles::add_roles_and_capabilities();
    }
    flush_rewrite_rules();
});
