<?php
/**
 * Main Template File for KAIA Theme
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!is_user_logged_in()) {
    auth_redirect();
    exit;
}

if (class_exists('KAIA_App')) {
    KAIA_App::enqueue_assets('kaia_theme');
}
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
    <div id="kaia-app-root" class="kaia-container"></div>
    <?php wp_footer(); ?>
</body>
</html>
