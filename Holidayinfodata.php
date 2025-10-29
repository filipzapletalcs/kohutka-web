<?php

/**
 * Plugin Name: Holiday Info Data
 * Description: Manages holiday center XML data by fetching, storing, and processing it in the database.
 * Version: 1.6
 * Author: Effistream
 */

// Prevent direct access
if (!defined('ABSPATH')) exit;

// Option key and default URL
define('HID_FETCH_URL_OPTION', 'hid_fetch_url');
define('HID_DEFAULT_FETCH_URL', 'https://exports.holidayinfo.cz/xml_export.php?dc=c9ixxlejab5d4mrr&localias=kohutka');

// Constants for cron schedule
define('HID_CRON_SCHEDULE_OPTION', 'hid_cron_schedule');
define('HID_DEFAULT_CRON_SCHEDULE', 'every_15_minutes');

// Constants for default location values
define('HID_DEFAULT_LOCATION_OPTION', 'hid_default_location');
define('HID_DEFAULT_LOCATION', [
    'country' => ['id' => '1', 'name' => 'Česká Republika', 'alias' => 'cz'],
    'region' => ['id' => '1-9', 'name' => 'Javorníky', 'alias' => 'javorniky'],
    'location' => ['id' => '1-9-4', 'name' => 'Kohútka', 'alias' => 'kohutka']
]);

// Constants to display "friendly" default text for some default values
define('HID_DEFAULT_STATUS_TEXT', [
    'operation_text' => ['value' => 'N/A', 'default_text' => '&nbsp;'],
    'opertime' => ['value' => '00:00-00:00', 'default_text' => '&nbsp;'],
    'snowheight' => ['value' => 'N/A', 'default_text' => '&nbsp;'],
    'weather_0700_text' => ['value' => '-', 'default_text' => '&nbsp;'],
    'temp_0700' => ['value' => '-', 'default_text' => '&nbsp;']
]);

$hid_shortcode_categories = [
    [
        'id' => 1,
        'name' => 'loc_info',
        'description' => 'basic information about the center - altitude, contact information, etc.'
    ],
    [
        'id' => 2,
        'name' => 'loc_info_winter',
        'description' => 'winter information about the center - snow depth, etc.'
    ],
    [
        'id' => 3,
        'name' => 'loc_info_winter_panomaps',
        'description' => 'winter information about the center - additional information - list of static panoramic images'
    ],
    [
        'id' => 4,
        'name' => 'loc_info_winter_flashmaps',
        'description' => 'winter information about the center - additional information - list of flash (interactive) maps'
    ],
    [
        'id' => 5,
        'name' => 'loc_info_winter_intmaps',
        'description' => 'winter information about the center - additional information - list of html5/svg (interactive) maps'
    ],
    [
        'id' => 6,
        'name' => 'loc_info_winter_photos',
        'description' => 'winter information about the center - additional information - list of winter photos of the center'
    ],
    [
        'id' => 7,
        'name' => 'loc_info_summer_panomaps',
        'description' => 'summer information about the center - additional information - list of static panoramic images Map'
    ],
    [
        'id' => 8,
        'name' => 'loc_info_summer_flashmaps',
        'description' => 'Summer information about the resort - additional information - list of flash (interactive) maps'
    ],
    [
        'id' => 9,
        'name' => 'loc_info_summer_intmaps',
        'description' => 'Summer information about the resort - additional information - list of html5/svg (interactive) maps'
    ],
    [
        'id' => 10,
        'name' => 'loc_info_summer_photos',
        'description' => 'Summer information about the resort - additional information - list of winter photos of the resort'
    ],
    [
        'id' => 11,
        'name' => 'loc_slopes',
        'description' => 'information about ski slopes to the resort'
    ],
    [
        'id' => 12,
        'name' => 'loc_lifts',
        'description' => 'information about cable cars and lifts to the resort'
    ],
    [
        'id' => 13,
        'name' => 'loc_crosscountry',
        'description' => 'information about cross-country skiing trails to the resort'
    ],
    [
        'id' => 14,
        'name' => 'loc_snowparks',
        'description' => 'information about snow parks to the resort'
    ],
    [
        'id' => 15,
        'name' => 'loc_services',
        'description' => 'information about services to the resort'
    ],
    [
        'id' => 16,
        'name' => 'loc_bikeparks',
        'description' => 'information about bike parks to the resort'
    ],
    [
        'id' => 17,
        'name' => 'loc_news',
        'description' => 'information about news to the resort'
    ],
    [
        'id' => 18,
        'name' => 'loc_parking',
        'description' => 'information about parking lots to the resort'
    ],
    [
        'id' => 19,
        'name' => 'loc_events',
        'description' => 'information about events organized for the resort'
    ],
    [
        'id' => 20,
        'name' => 'loc_cams',
        'description' => 'information about cameras for the resort'
    ],
    [
        'id' => 21,
        'name' => 'loc_cams_gal',
        'description' => 'daily gallery of cameras for the resort'
    ],
    [
        'id' => 22,
        'name' => 'loc_cams_hotspots',
        'description' => 'images of hotspots from cameras for the resort'
    ],
    [
        'id' => 23,
        'name' => 'loc_cams_panoimg',
        'description' => 'panoramic images from cameras for the resort'
    ],
    [
        'id' => 24,
        'name' => 'loc_skibuses',
        'description' => 'information about ski buses'
    ],
];


// Add custom cron intervals
add_filter('cron_schedules', function ($schedules) {
    $schedules['every_15_minutes'] = [
        'interval' => 900,
        'display'  => __('Every 15 Minutes'),
    ];
    $schedules['every_30_minutes'] = [
        'interval' => 1800,
        'display'  => __('Every 30 Minutes'),
    ];
    return $schedules;
});

// RH 29.1.2025 23:25
function hid_register_cron_event($schedule = null) {
    if (!$schedule) {
        $schedule = get_option(HID_CRON_SCHEDULE_OPTION, HID_DEFAULT_CRON_SCHEDULE);
    }

    // Validate the schedule
    $valid_schedules = array_keys(wp_get_schedules());
    if (!in_array($schedule, $valid_schedules, true)) {
        $schedule = HID_DEFAULT_CRON_SCHEDULE; // Fallback to default if invalid
    }

    // Clear any existing scheduled event
    if (wp_next_scheduled('hid_cron_data_fetch')) {
        wp_clear_scheduled_hook('hid_cron_data_fetch');
    }

    // If the schedule is "manual," do not schedule a new event
    if ($schedule === 'manual') {
        return;
    }

     // Schedule the new event
     wp_schedule_event(time(), $schedule, 'hid_cron_data_fetch');

}

// Use init instead of wp action
add_action('init', function () {
    hid_register_cron_event();
});



// Function to execute data fetch via WP Cron
function hid_cron_fetch_data()
{
    $fetch_url = get_option(HID_FETCH_URL_OPTION, HID_DEFAULT_FETCH_URL);

    if (!function_exists('hid_import_mysite_xml_data')) {
        error_log("[HolidayInfo] Error: Required function 'hid_import_mysite_xml_data' is missing.");
        return;
    }

    try {
        hid_import_mysite_xml_data($fetch_url);
        error_log("[HolidayInfo] Data import completed successfully from: $fetch_url");
    } catch (Exception $e) {
        error_log("[HolidayInfo] Error during data import: " . $e->getMessage());
    }
}

// Hook the cron event to the function
add_action('hid_cron_data_fetch', 'hid_cron_fetch_data');



// Add admin menu for plugin configuration
function hid_add_admin_menu()
{
    add_menu_page(
        __('Holiday Info Settings', 'holiday-info-data'),
        __('Holiday Info', 'holiday-info-data'),
        'manage_options',
        'holiday-info-settings',
        'hid_settings_page',
        'dashicons-admin-tools'
    );
}
add_action('admin_menu', 'hid_add_admin_menu');

// RH 29.1.2025 23:54 Admin settings page
function hid_settings_page()
{
    // Retrieve saved values or defaults
    $default_location = get_option(HID_DEFAULT_LOCATION_OPTION, HID_DEFAULT_LOCATION);
    $fetch_url = get_option(HID_FETCH_URL_OPTION, HID_DEFAULT_FETCH_URL);
    $cron_schedule = get_option(HID_CRON_SCHEDULE_OPTION, HID_DEFAULT_CRON_SCHEDULE);
    $message = __('Settings saved.', 'holiday-info-data'); // Default success message

    if (!current_user_can('manage_options')) {
        return;
    }

    // Handle form submission
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        check_admin_referer('hid_save_settings');

        // Save location values
        $default_location = [
            'country' => [
                'id' => sanitize_text_field($_POST['country_id']),
                'name' => sanitize_text_field($_POST['country_name']),
                'alias' => sanitize_text_field($_POST['country_alias']),
            ],
            'region' => [
                'id' => sanitize_text_field($_POST['region_id']),
                'name' => sanitize_text_field($_POST['region_name']),
                'alias' => sanitize_text_field($_POST['region_alias']),
            ],
            'location' => [
                'id' => sanitize_text_field($_POST['location_id']),
                'name' => sanitize_text_field($_POST['location_name']),
                'alias' => sanitize_text_field($_POST['location_alias']),
            ],
        ];
        update_option(HID_DEFAULT_LOCATION_OPTION, $default_location);

        // Save fetch URL
        update_option(HID_FETCH_URL_OPTION, sanitize_text_field($_POST['fetch_url']));

        // Check if cron_schedule has changed
        $new_cron_schedule = sanitize_text_field($_POST['cron_schedule']);
        if ($new_cron_schedule !== $cron_schedule) {
            // Save the new cron schedule
            update_option(HID_CRON_SCHEDULE_OPTION, $new_cron_schedule);

            // Update the cron schedule
            hid_register_cron_event($new_cron_schedule);

            // Append manual schedule warning if selected
            if ($new_cron_schedule === 'manual') {
                $message .= ' ' . __('Manual CRON schedule required!!!', 'holiday-info-data');
            }
        }

        echo '<div class="updated"><p>' . $message . '</p></div>';
    } else {
        // Ensure cron is scheduled on first load unless "manual" is selected
        if ($cron_schedule !== 'manual' && !wp_next_scheduled('hid_cron_data_fetch')) {
            hid_register_cron_event($cron_schedule);
        }
    }

    // Start the settings page output
    ?>
    <div class="wrap">
        <h1><?php _e('Holiday Info Settings', 'holiday-info-data'); ?></h1>
        <form method="POST">
            <?php wp_nonce_field('hid_save_settings'); ?>

            <h2><?php _e('Default Values', 'holiday-info-data'); ?></h2>
            <table class="form-table">
                <!-- Country Information -->
                <tr>
                    <th scope="row"><label for="country_id"><?php _e('Country ID', 'holiday-info-data'); ?></label></th>
                    <td><input type="text" name="country_id" value="<?php echo esc_attr($default_location['country']['id']); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th scope="row"><label for="country_name"><?php _e('Country Name', 'holiday-info-data'); ?></label></th>
                    <td><input type="text" name="country_name" value="<?php echo esc_attr($default_location['country']['name']); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th scope="row"><label for="country_alias"><?php _e('Country Alias', 'holiday-info-data'); ?></label></th>
                    <td><input type="text" name="country_alias" value="<?php echo esc_attr($default_location['country']['alias']); ?>" class="regular-text"></td>
                </tr>
                <!-- Region Information -->
                <tr>
                    <th scope="row"><label for="region_id"><?php _e('Region ID', 'holiday-info-data'); ?></label></th>
                    <td><input type="text" name="region_id" value="<?php echo esc_attr($default_location['region']['id']); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th scope="row"><label for="region_name"><?php _e('Region Name', 'holiday-info-data'); ?></label></th>
                    <td><input type="text" name="region_name" value="<?php echo esc_attr($default_location['region']['name']); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th scope="row"><label for="region_alias"><?php _e('Region Alias', 'holiday-info-data'); ?></label></th>
                    <td><input type="text" name="region_alias" value="<?php echo esc_attr($default_location['region']['alias']); ?>" class="regular-text"></td>
                </tr>
                <!-- Location Information -->
                <tr>
                    <th scope="row"><label for="location_id"><?php _e('Location ID', 'holiday-info-data'); ?></label></th>
                    <td><input type="text" name="location_id" value="<?php echo esc_attr($default_location['location']['id']); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th scope="row"><label for="location_name"><?php _e('Location Name', 'holiday-info-data'); ?></label></th>
                    <td><input type="text" name="location_name" value="<?php echo esc_attr($default_location['location']['name']); ?>" class="regular-text"></td>
                </tr>
                <tr>
                    <th scope="row"><label for="location_alias"><?php _e('Location Alias', 'holiday-info-data'); ?></label></th>
                    <td><input type="text" name="location_alias" value="<?php echo esc_attr($default_location['location']['alias']); ?>" class="regular-text"></td>
                </tr>
            </table>

            <h2><?php _e('Fetch URL and Cron Settings', 'holiday-info-data'); ?></h2>
            <table class="form-table">
                <!-- Fetch URL -->
                <tr>
                    <th scope="row"><label for="fetch_url"><?php _e('Fetch URL', 'holiday-info-data'); ?></label></th>
                    <td><input type="text" name="fetch_url" value="<?php echo esc_attr($fetch_url); ?>" class="large-text"></td>
                </tr>
                <!-- Cron Schedule -->
                <tr>
                    <th scope="row"><label for="cron_schedule"><?php _e('Cron Schedule', 'holiday-info-data'); ?></label></th>
                    <td>
                        <select name="cron_schedule">
                            <option value="manual" <?php selected($cron_schedule, 'manual'); ?>><?php _e('Manual', 'holiday-info-data'); ?></option>
                            <option value="every_15_minutes" <?php selected($cron_schedule, 'every_15_minutes'); ?>><?php _e('Every 15 Minutes', 'holiday-info-data'); ?></option>
                            <option value="every_30_minutes" <?php selected($cron_schedule, 'every_30_minutes'); ?>><?php _e('Every 30 Minutes', 'holiday-info-data'); ?></option>
                            <option value="hourly" <?php selected($cron_schedule, 'hourly'); ?>><?php _e('Hourly', 'holiday-info-data'); ?></option>
                        </select>
                    </td>
                </tr>
            </table>

            <?php submit_button(__('Save Settings', 'holiday-info-data')); ?>
        </form>
    </div>
    <?php
}


// RH 29.1.2025 22:05 Activation hook
function hid_plugin_activation() {
    // Ensure required database table exists
    hid_create_xml_table();

    // Initialize default options if not already set
    if (!get_option(HID_FETCH_URL_OPTION)) {
        update_option(HID_FETCH_URL_OPTION, HID_DEFAULT_FETCH_URL);
    }
    if (!get_option(HID_CRON_SCHEDULE_OPTION)) {
        update_option(HID_CRON_SCHEDULE_OPTION, HID_DEFAULT_CRON_SCHEDULE);
    }
    if (!get_option(HID_DEFAULT_LOCATION_OPTION)) {
        update_option(HID_DEFAULT_LOCATION_OPTION, HID_DEFAULT_LOCATION);
    }

    // Insert default XML data
    if (!hid_get_xml_record('default')) {
        hid_insert_default_xml_with_params(HID_DEFAULT_FETCH_URL);
    }

    // Register cron job (if not manual schedule)
    $cron_schedule = get_option(HID_CRON_SCHEDULE_OPTION);
    if ($cron_schedule !== 'manual') {
        hid_register_cron_event($cron_schedule);
    }

    // Fetch data immediately
    hid_cron_fetch_data();
}
register_activation_hook(__FILE__, 'hid_plugin_activation');




// Deactivation hook
function hid_clear_plugin_settings()
{
    delete_option(HID_FETCH_URL_OPTION);
    delete_option(HID_CRON_SCHEDULE_OPTION);
    delete_option(HID_DEFAULT_LOCATION_OPTION);
    wp_clear_scheduled_hook('hid_cron_data_fetch');
}
register_deactivation_hook(__FILE__, 'hid_clear_plugin_settings');


/**
 * Enqueue the CSS file for the slopes shortcode.
 */
function enqueue_slopes_styles() {
    // Define the CSS file URL
    $css_url = plugins_url('css/css_default_slopes.css', __FILE__);

    // Enqueue the stylesheet if it's not already enqueued
    if (!wp_style_is('hol-slopes-style', 'enqueued')) {
        wp_enqueue_style('hol-slopes-style', $css_url);
    }
}

// Hook the function to enqueue styles when shortcodes are processed
add_action('wp_enqueue_scripts', 'enqueue_slopes_styles');


/**
 * Enqueue the CSS file for the slopes shortcode.
 */
function enqueue_lifts_styles() {
    // Define the CSS file URL
    $css_url = plugins_url('css/css_default_lifts.css', __FILE__);

    // Enqueue the stylesheet if it's not already enqueued
    if (!wp_style_is('hol-lifts-style', 'enqueued')) {
        wp_enqueue_style('hol-lifts-style', $css_url);
    }
}

// Hook the function to enqueue styles when shortcodes are processed
add_action('wp_enqueue_scripts', 'enqueue_lifts_styles');



/* CORE PLUGIN FUNCTIONALITY */

/**
 * CREATE 'mysite_xml_data' table - called within plugin activation , to save ('current', 'last', 'default') types of XML data being fetched via CRON.
 *
 * @param  None.
 * @return None.
 * RH 29.1.2025
 */
function hid_create_xml_table()
{
    global $wpdb;
    $table_name = $wpdb->prefix . 'mysite_xml_data';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id INT NOT NULL AUTO_INCREMENT,
        type VARCHAR(10) NOT NULL,
        xml_data LONGTEXT NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY (type)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);

    error_log("[HolidayInfo] Table '$table_name' created or updated.");
}

/**
 * Insert 'default' XML record  into the 'mysite_xml_data' table by type.
 *
 * @param string $fetch_url The export portal URL including parameters
 * @return None.
 */
function hid_insert_default_xml_with_params($fetch_url)
{
    global $wpdb;
    $table_name = $wpdb->prefix . 'mysite_xml_data';

    $default_xml_content = file_get_contents($fetch_url);

    if ($default_xml_content === false) {
        error_log("Error: Failed to fetch XML data from $fetch_url.");
        return;
    }

    $wpdb->replace($table_name, [
        'type' => 'default',
        'xml_data' => $default_xml_content,
    ]);

    error_log("Default XML fetched from $fetch_url and inserted successfully.");
}

/**
 * Save an XML record from the 'mysite_xml_data' table by type.
 *
 * @param string $type The type of XML record to save ('current', 'last', 'default').
 * @param string $xml_data XML record to be saved.
 * @return  None.
 */
function hid_save_xml_record($type, $xml_data)
{
    global $wpdb;
    $table_name = $wpdb->prefix . 'mysite_xml_data';

    $wpdb->replace($table_name, [
        'type' => $type,
        'xml_data' => $xml_data,
    ]);
}


/**
 * Retrieve an XML record from the 'mysite_xml_data' table by type.
 *
 * @param string $type The type of XML record to retrieve ('current', 'last', 'default').
 * @return string|null The XML data if found, or null if no record matches.
 */
function hid_get_xml_record($type)
{
    global $wpdb;
    $table_name = $wpdb->prefix . 'mysite_xml_data';

    $xml_data = $wpdb->get_var($wpdb->prepare(
        "SELECT xml_data FROM $table_name WHERE type = %s LIMIT 1",
        $type
    ));

    return $xml_data ? $xml_data : null;
}

/**
 * Get the latest XML record available in the 'mysite_xml_data' table.
 * Attempts to get the record in the following order: 'current', 'last', 'default'.
 *
 * @return string|null The XML data if found, or null if no records are available.
 */
function hid_get_actual_xml_record()
{
    // Try fetching the 'current' XML data
    $xml_data = hid_get_xml_record('current');
    if ($xml_data) {
        return $xml_data;
    }

    // Try fetching the 'last' XML data
    $xml_data = hid_get_xml_record('last');
    if ($xml_data) {
        return $xml_data;
    }

    // Try fetching the 'default' XML data
    $xml_data = hid_get_xml_record('default');
    if ($xml_data) {
        return $xml_data;
    }

    // If no records are found, return an error
    error_log("[HolidayInfo - hid_get_actual_xml_record] No XML data available in the 'mysite_xml_data' table.");
    return null; // Return null to indicate no data was found
}


/**
 * Import and Save XML data and handle 'current', 'last', and 'default' records based on status.
 *
 * @param string $fetch_url The URL to fetch the XML data from.
 */
function hid_import_mysite_xml_data($fetch_url)
{
    try {
        // Fetch the current XML from the remote source
        $current_xml = file_get_contents($fetch_url);
        if ($current_xml === false) {
            throw new Exception("Failed to fetch XML data from $fetch_url.");
        }

        // Check the XML status
        $status = hid_check_mysite_xml_data($current_xml, $messages);
        error_log("[HolidayInfo] hid_import_mysite_xml_data status variable: " . $status);

        if ($status === 'ok') {
            // Backup the last "current" XML to "last"
            $last_xml = hid_get_xml_record('current');
            if ($last_xml) {
                hid_save_xml_record('last', $last_xml);
            }

            // Save the new "current" XML
            hid_save_xml_record('current', $current_xml);
            error_log("[HolidayInfo] Data import to CURRENT successful. Status: $status");
        } elseif ($status === 'err') {
            error_log("[HolidayInfo] Data import to CURRENT failed with errors: $messages");

            // Fallback to the "last" XML
            $last_xml = hid_get_xml_record('last');
            if ($last_xml) {
                hid_save_xml_record('current', $last_xml);
            } else {
                error_log("[HolidayInfo] No last XML available, falling back to default XML.");
                $default_xml = hid_get_xml_record('default');
                if ($default_xml) {
                    hid_save_xml_record('current', $default_xml);
                } else {
                    error_log("[HolidayInfo] No default XML available.");
                }
            }
        } elseif ($status === 'warn') {
            error_log("[HolidayInfo] Data import completed with warnings: $messages");

            // Save the new "current" XML but log warnings
            hid_save_xml_record('current', $current_xml);
        } else {
            throw new Exception("Unknown status in XML data.");
        }
    } catch (Exception $e) {
        error_log("[HolidayInfo] Critical error during data import: " . $e->getMessage());
    }
}


/**
 * Check the <status> and related <err> or <warn> messages in the <retstatus> tag of the XML data.
 *
 * @param string $xml_data The XML content as a string.
 * @param string|null &$messages Concatenated error or warning messages (if any).
 * @return string|null The value of the <status> tag or null if parsing fails.
 */

function hid_check_mysite_xml_data($xml_data, &$messages = null) {
    $messages = null; // Reset messages

    // Load the XML
    $xml = simplexml_load_string($xml_data);
    if (!$xml) {
        $messages = __('Failed to parse XML data.', 'holiday-info-data');
        error_log("[HolidayInfo] XML Parsing Error: " . print_r($xml_data, true));
        return null;
    }

    // Try accessing <retstatus> directly or through <export>
    $retstatus = isset($xml->retstatus) ? $xml->retstatus : (isset($xml->export->retstatus) ? $xml->export->retstatus : null);
    
    // Try accessing via XPath if direct access fails
    if (!$retstatus) {
        error_log("[HolidayInfo] WARNING: Direct access failed, tried XPath to get <retstatus> Tag");
        $result = $xml->xpath('//retstatus');
        if ($result && is_array($result) && isset($result[0])) {
            $retstatus = $result[0];
        }
    }

    // If still not found, log an error
    if (!$retstatus) {
        $messages = __('Missing <retstatus> tag in XML data.', 'holiday-info-data');
        error_log("[HolidayInfo] ERROR: Missing <retstatus> Tag");
        return null;
    }

    // Debugging output
    error_log("[HolidayInfo] Found <retstatus> Tag: " . print_r($retstatus, true));

    // Extract <status> tag
    $status = isset($retstatus->status) ? (string) $retstatus->status : null;

    // Collect <err> or <warn> messages based on the <status>
    $messagesArray = [];
    if ($status === 'err') {
        foreach ($retstatus->err as $err) {
            $messagesArray[] = __('[Error]', 'holiday-info-data') . ' ' . (string) $err;
        }
    } elseif ($status === 'warn') {
        foreach ($retstatus->warn as $warn) {
            $messagesArray[] = __('[Warning]', 'holiday-info-data') . ' ' . (string) $warn;
        }
    }

    $messages = implode('; ', $messagesArray); // Concatenate messages for output
    return $status;
}



/**
 * If the plugin is inactive, WordPress may display a warning when is_plugin_active() is called. To avoid this, ensure the function exists
 * Adding snippet above the hid_shortcode_actual_xml_record function.
 */
if (!function_exists('is_plugin_active')) {
    require_once ABSPATH . 'wp-admin/includes/plugin.php';
}


/**
 * Shortcode to fetch and display the latest XML data record.
 *
 * @return string The actual XML data record or an error message.
 */
function hid_shortcode_actual_xml_record()
{
    // Ensure the plugin is active
    if (!is_plugin_active('holiday-info-data/holiday-info-data.php')) {
        return __('Error: The Holiday Info Data plugin is not active.', 'holiday-info-data');
    }

    // Fetch the actual XML data record
    $actual_xml_data = hid_get_actual_xml_record();

    // Return the data or an error message
    if ($actual_xml_data) {
        return '<pre>' . htmlentities($actual_xml_data) . '</pre>';
    } else {
        return __('Error -  hid_shortcode_actual_xml_record: No XML data is available.', 'holiday-info-data');
    }
}
add_shortcode('actual_xml_record', 'hid_shortcode_actual_xml_record');


/**
 * Shortcode to generate output for loc_info_winter based on a string parameter.
 *
 * @param array $atts Attributes passed to the shortcode.
 *      'Operations'    - basic info about operational status and timeslot
 *      'Weather'       - basic info about weather and snow
 *      'LiftsStatus'   - counts operational lifts excluding Skipark For Children
 *      'SlopesStatus'  - counts operational and total slopes
 *      'SkiPark'       - Info about Skipark for Children (int)$lift->type_code == 7
 * @return string Generated HTML output.
 */
function hid_shortcode_loc_info_winter($atts) {
    // Define default attributes
    $atts = shortcode_atts([
        'type' => 'Operations', // Default type (formerly 'basic')
    ], $atts);

    // Fetch the actual XML data
    $xml_data = hid_get_actual_xml_record();
    if (!$xml_data) {
        return __('Error - hid_shortcode_loc_info_winter: No XML data is available.', 'holiday-info-data');
    }

    // Parse the XML
    $xml = simplexml_load_string($xml_data);
    if (!$xml) {
        return __('Error: Failed to parse XML data.', 'holiday-info-data');
    }

    // ✅ Locate main XML elements
    $loc_info_winter = $xml->xpath('//location/loc_info_winter')[0] ?? null;
    $loc_slopes = $xml->xpath('//location/loc_slopes')[0] ?? null;
    $loc_lifts = $xml->xpath('//location/loc_lifts')[0] ?? null;
    $loc_cams = $xml->xpath('//location/loc_cams')[0] ?? null;

    if (!$loc_info_winter) {
        return __('Error: No winter location data found.', 'holiday-info-data');
    }

    // ✅ Extract values from <loc_info_winter>
    $operation_text = (string)$loc_info_winter->operation_text ?? __('N/A', 'holiday-info-data');
    $opertime = (string)$loc_info_winter->opertime ?? __('N/A', 'holiday-info-data');
    $operation_code = (int)$loc_info_winter->operation_code ?? 0;

    if ($operation_text == HID_DEFAULT_STATUS_TEXT['operation_text']['value']) {
        $operation_text = HID_DEFAULT_STATUS_TEXT['operation_text']['default_text'];
    }

    if ($opertime == HID_DEFAULT_STATUS_TEXT['opertime']['value']) {
        $opertime = HID_DEFAULT_STATUS_TEXT['opertime']['default_text'];
    }

    // ✅ Define styles
    $style_red = 'color: red; font-weight: bold;';
    $style_green = 'color: green; font-weight: bold;';
    $current_style = in_array($operation_code, [1, 2]) ? $style_red : $style_green;

    // ✅ Handle different output types
    switch ($atts['type']) {
        case 'Operations':
            return sprintf(
                /* RH LAST '<div>
                    <span style="%s">%s</span><br/><span style="%s">%s</span><br/>
                    <span style="%s">%s</span>
                </div>', */
                '<div><span style="%s">%s</span><br/><span style="%s">%s</span></div>',
                $current_style,
                esc_html($operation_text),
                $current_style,
                esc_html($opertime)
            );

        case 'Weather':
            // ❄️ Extract snow height values
            $snowheight_slopes_min = trim((string)$loc_info_winter->snowheight_slopes_min ?? '');
            $snowheight_slopes_max = trim((string)$loc_info_winter->snowheight_slopes_max ?? '');

            // 🌤️ Extract weather info
            $weather_text = (string)$loc_info_winter->weather_0700_text ?? __('N/A', 'holiday-info-data');
            $temp_default_text = (string)$loc_info_winter->temp_0700 ?? __('N/A', 'holiday-info-data');

            if ($weather_text == HID_DEFAULT_STATUS_TEXT['weather_0700_text']['value']) {
                $weather_text = HID_DEFAULT_STATUS_TEXT['weather_0700_text']['default_text'];
            }

            if ($temp_default_text == HID_DEFAULT_STATUS_TEXT['temp_0700']['value']) {
                $temp_default_text = HID_DEFAULT_STATUS_TEXT['temp_0700']['default_text'];
            }

            // 🌡️ Extract temperature from camera id="3122"
            $temp_peak_text = null;
            if ($loc_cams) {
                foreach ($loc_cams->cam as $cam) {
                    if ((string)$cam['id'] == "3122") {
                        $temp_peak_text = (string)$cam->media->last_image->temp ?? null;
                        break;
                    }
                }
            }

            // Set temperature (prefer peak cam temp)
            $temperature = !empty($temp_peak_text) ? $temp_peak_text : $temp_default_text;

            // 🏔️ Properly format snow height
            if (!empty($snowheight_slopes_min) && !empty($snowheight_slopes_max)) {
                $snowheight = esc_html($snowheight_slopes_min) . '&nbsp;-&nbsp;' . esc_html($snowheight_slopes_max) . '&nbsp;cm';
            } elseif (!empty($snowheight_slopes_min)) {
                $snowheight = esc_html($snowheight_slopes_min) . '&nbsp;cm';
            } elseif (!empty($snowheight_slopes_max)) {
                $snowheight = esc_html($snowheight_slopes_max) . '&nbsp;cm';
            } else {
                $snowheight = __('N/A', 'holiday-info-data');
            }

            if ($snowheight == HID_DEFAULT_STATUS_TEXT['snowheight']['value']) {
                $snowheight = HID_DEFAULT_STATUS_TEXT['snowheight']['default_text'];
            }

            return sprintf(
                '<div>
                    <span style="%s">&nbsp;%s°C&nbsp;&nbsp;%s&nbsp;</span><br/>
                    <span style="%s">%s</span>
                </div>',
                $current_style,
                esc_html($temperature),
                esc_html($weather_text),
                $current_style,
                esc_html($snowheight)
            );

        case 'LiftsStatus':
            if (!$loc_lifts) {
                return __('Error: No lift data found.', 'holiday-info-data');
            }

            $NumChairLift = 0;
            $NumSurfaceLift = 0;
            $NumTotalSurfaceLift = 0;
            $NumOSurfaceLiftOn = 0;

            foreach ($loc_lifts->lift as $lift) {
                $status_code = (int)$lift->status_code;
                $type_code = (int)$lift->type_code;
                if ($type_code != 7) { // NEPOCITAT DETSKY SKIPARK
                    $NumTotalSurfaceLift++;
                    if ($status_code != 2) { // ✅ Only count lifts that are NOT "mimo provoz"
                        if ($type_code == 4) {
                            $NumChairLift++;
                        } else {
                            $NumSurfaceLift++;
                        }

                    }
                }
            }    
            return sprintf(
                /* RH LAST '<div>
                    <span style="%s">&nbsp;%s&nbsp;z&nbsp;%s&nbsp;</span><br/>
                    <span>&nbsp;</span>
                </div>', */
                '<div><span style="%s">&nbsp;%s&nbsp;z&nbsp;%s&nbsp;</span></div>',
                $current_style,
                esc_html($NumSurfaceLift + $NumChairLift),
                esc_html($NumTotalSurfaceLift)
            );

        case 'SkiPark':
            if (!$loc_lifts) {
                return __('Error: No lift data found.', 'holiday-info-data');
            }

            $SkiParkStatus = "zavřen";
            $SkiParkCount = 0;
            
            foreach ($loc_lifts->lift as $lift) { 
                if ( (int)$lift->type_code == 7 && (int)$lift->status_code != 2) {                   
                    $SkiParkStatus = "otevřen"; // alespoň jeden skipark otevřen (string)$lift->status_text;
                    $SkiParkCount++;
                }
            }
            
            if ($SkiParkCount >1 ) {
                $SkiParkStatus .= "{$SkiParkCount} x ";
            }

            $current_style = ($SkiParkCount == 0) ? $style_red : $style_green;

            return sprintf(
                /* RH LAST '<div>
                    <span style="%s">%s</span><br/>
                    <span>&nbsp;</span>
                </div>', */
                '<span style="%s">%s</span>',
                $current_style,
                esc_html($SkiParkStatus)
            );

        case 'SlopesStatus':
            if (!$loc_slopes) {
                return __('Error: No slope data found.', 'holiday-info-data');
            }

            $NumAllSlopes = 0;
            $NumOpenSlopes = 0;

            foreach ($loc_slopes->slope as $slope) {
                $NumAllSlopes++;
                $status_code = (int)$slope->status_code;
                
                if ($status_code == 2 || $status_code == 6) { // ✅ Count only open slopes
                    $NumOpenSlopes++;
                }
            }

            return sprintf(
                /* RH LAST '<div>
                    <span style="%s">&nbsp;%s&nbsp;z&nbsp;%s&nbsp;</span><br/>
                    <span>&nbsp;</span>
                </div>', */
                '<div><span style="%s">&nbsp;%s&nbsp;z&nbsp;%s&nbsp;</span></div>',
                $current_style,
                esc_html($NumOpenSlopes),
                esc_html($NumAllSlopes)
            );

        default:
            return __('Invalid type parameter.', 'holiday-info-data');
    }
}
add_shortcode('loc_info_winter', 'hid_shortcode_loc_info_winter');


/**
 * Shortcode to generate a dynamic HTML table displaying slopes data.
 * [slopes cssprefix="ski_table" idprefix="ski" columns="name,status_img,exceed,length" flags="addtotalrow"]
 * Basic Table:
 *      [slopes columns="status_img,id,diff_img,name,exceed,length"]
 * Table with No Header:
 *      [slopes columns="status_img,id,diff_img,name,exceed,length" flags="notablehead"]
 * Table with Custom CSS:
 *      [slopes columns="status_img,name,status_text" cssurl="custom_styles.css"]
 * 
 * 'flags'
 *     - nohtmlbody – potlačení vygenerování „obalového“ html – tj. tagů <html>,<head>, <body>, tj. je vygenerován pouze HTML kód samotné tabulky, ale
 *                    vždy s '<link rel="stylesheet" type="text/css" href="' . esc_attr($atts['cssurl']) . '">' elementem
 *     - notablehead – potlačení prvního řádku tabulky s titulky sloupců
 *     - addtotalrow – přidání posledního řádku se součty u relevantních sloupců
 *     - scrollable  - přidání scrollable div for samll screens
 */
function hid_shortcode_slopes($atts) {
    // Default shortcode attributes
    $atts = shortcode_atts([
        'cssprefix' => 'hol_slopes',
        'idprefix' => 'hol_slopes',
        'columns' => 'id,name,diff_txt,diff_img,exceed,length,status_txt,status_img,nightskiing,snowmaking',
        'cssurl' => 'css/css_default_slopes.css',
        'flags' => 'nohtmlbody, addtotalrow'
    ], $atts);

    error_log("[HolidayInfo] Slopes Attributes: " . print_r($atts, true));

    // Parse columns and remove spaces
    $columns = array_map('trim', explode(',', $atts['columns']));

    // DEGUG OK error_log("[HolidayInfo] Parsed columns: " . implode(', ', $columns));

    // Fetch XML data
    $xml_data = hid_get_actual_xml_record();
    if (!$xml_data) {
        error_log("[HolidayInfo] ERROR: No XML data available");
        return __('Error - hid_shortcode_slopes: No XML data is available.', 'holiday-info-data');
    }

    // DEBUG OK error_log("[HolidayInfo] XML data fetched successfully.");

    
    // Parse XML
    $xml = simplexml_load_string($xml_data);
    if (!$xml) {
        error_log("[HolidayInfo] ERROR: Failed to parse XML");
        return __('Error: Failed to parse XML data.', 'holiday-info-data');
    }

    // Locate slopes data
    // ERROR $loc_slopes = $xml->xpath("//location/loc_slopes/slope");
    $loc_slopes = $xml->xpath('//location/loc_slopes')[0] ?? null;
    if (!$loc_slopes) {
        error_log("[HolidayInfo] ERROR: No <loc_slopes> section found in XML.");
        return __('Error: No slope data found.', 'holiday-info-data');
    }

    // DEBUG OK error_log("[HolidayInfo] Found " . count($loc_slopes) . " slopes in XML.");

    // Initialize totals
    $NumAllSlopes = 0;
    $NumOpenSlopes = 0;
    $NumNightSki = 0;
    $NumSnowMaking = 0;
    $TotalExceed = 0;
    $TotalLength = 0;

    // Process slopes data
    $rows = [];
    $rows_td= [];

    foreach ($loc_slopes as $slope) {
        $NumAllSlopes++;

        // Get individual values
        $status_code = (int) $slope->status_code;
        $diff_code = (int) $slope->diff_code;
        $nightskiing_code = (int) $slope->nightskiing_code;
        $snowmaking_code = (int) $slope->snowmaking_code;

        // Count open slopes
        if (in_array($status_code, [2, 6])) {
            $NumOpenSlopes++;
        }

        // Count slopes with night skiing
        if ($nightskiing_code == 2) {
            $NumNightSki++;
        }

        // Count slopes with artificial snow
        if ($snowmaking_code == 2) {
            $NumSnowMaking++;
        }

        // Sum exceed and length
        $TotalExceed += (int) $slope->exceed;
        $TotalLength += (int) $slope->length;

        // Store row data
        $rows[] = [
            'id' => (string) $slope->id,
            'name' => (string) $slope->name,
            'diff_txt' => (string) $slope->diff_text,
            'diff_img' => '', // Uses CSS for background image
            'exceed' => (int) $slope->exceed . ' m',
            'length' => (int) $slope->length . ' m',
            'status_txt' => (string) $slope->status_text,
            'status_img' => '', // Uses CSS for background image
            'nightskiing' => (string) $slope->nightskiing_text,
            'snowmaking' => (string) $slope->snowmaking_text
        ];

          // Store row data
          $rows_td[] = [
            'id' => '',
            'name' => '',
            'diff_txt' => '',
            'diff_img' => (string) $slope->diff_code, // Uses CSS for background image
            'exceed' => '',
            'length' => '',
            'status_txt' => '',
            'status_img' => (string) $slope->status_code, // Uses CSS for background image
            'nightskiing' => (string) $slope->nightskiing_code,
            'snowmaking' => (string) $slope->snowmaking_code
        ];
    }

    // DEBUG OK error_log("[HolidayInfo] Extracted slopes: " . print_r($rows, true));
    // DEBUG OK error_log("[HolidayInfo] Extracted slopes: " . print_r($rows_td, true));
    
    // Generate table
    $output = '';

   // Add wrapper if not suppressed
    if (!str_contains($atts['flags'], 'nohtmlbody')) {
        $output .= '<html><head>';
        $output .= '<link rel="stylesheet" type="text/css" href="' . plugins_url(esc_attr($atts['cssurl']), __FILE__) . '">';
        $output .= '</head><body>';
    }else {
        // Ensure CSS is still applied even if no HTML wrapper
        // $output .= '<link rel="stylesheet" type="text/css" href="' . plugins_url(esc_attr($atts['cssurl']), __FILE__)  . '">';
        // Enqueue the CSS file for the slopes shortcode using function enqueue_slopes_styles()
    }

    // Add scrollable wrapper for small screens if required
    if (str_contains($atts['flags'], 'scrollable')) {
        $output .= '<div class="table-container">';
    }

    // DEBUG OK error_log("[HolidayInfo] Wrapper: " . PHP_EOL . $output);
    
    // Start table
    $alias = HID_DEFAULT_LOCATION['location']['alias'];
    $output .= '<table id="' . esc_attr($atts['idprefix'] . '_tab_' . $alias) . '" class="' . esc_attr($atts['cssprefix'] . '_tab') . '">';

    // Table header if not suppressed
    if (!str_contains($atts['flags'], 'notablehead')) {
        $output .= '<tr id="' . esc_attr($atts['idprefix'] . '_tr_head') . '" class="' . esc_attr($atts['cssprefix'] . '_tr_head') . '">';
        $col_number = 0;
        foreach ($columns as $col) {
            $col_number++;
            $header_content = match ($col) {
                'id' => __('ID', 'holiday-info-data'),
                'name' => __('Sjezdovka', 'holiday-info-data'),
                'diff_txt' => __('Obtížnost', 'holiday-info-data'),
                'diff_img' => '',
                'exceed' => __('Převýšení', 'holiday-info-data'),
                'length' => __('Délka', 'holiday-info-data'),
                'status_txt' => __('Stav', 'holiday-info-data'),
                'status_img' => '',
                'nightskiing' => __('Več.Lyž.', 'holiday-info-data') ,
                'snowmaking' => __('Zasněž.', 'holiday-info-data'),
                default => ''
            };
            $output .= '<th id="'   . esc_attr($atts['idprefix'] . '_th_' . $col) ;
            $col_class = esc_attr("{$atts['cssprefix']}_th {$atts['cssprefix']}_th_{$col} {$atts['cssprefix']}_th_{$col_number} " .
                                    ($col_number % 2 ? "{$atts['cssprefix']}_th_odd" : "{$atts['cssprefix']}_th_even") );
            $output .= '" class="' . $col_class . '">' . esc_html($header_content) . '</th>';
        }
        $output .= '</tr>';
    }

    // DEBUG OK error_log("[HolidayInfo] Table Header: " . PHP_EOL . $output);
    
    // Table data rows
    $row_number = 0;
    foreach ($rows as $row) {
        $row_number++;
        $row_class = esc_attr("{$atts['cssprefix']}_tr {$atts['cssprefix']}_tr_{$row_number} " . ($row_number % 2 ? "{$atts['cssprefix']}_tr_odd" : "{$atts['cssprefix']}_tr_even"));
        $output .= '<tr id="' . esc_attr($atts['idprefix'] . '_tr_' . $row_number) . '" class="' . $row_class . '">';
        $col_number = 0;
        foreach ($columns as $col) {
            $col_number++;
            $output .= '<td id="' . esc_attr($atts['idprefix'] . '_td_' . $row_number) . '_' . $col;
            $col_class = esc_attr("{$atts['cssprefix']}_td {$atts['cssprefix']}_td_{$col} {$atts['cssprefix']}_td_{$col_number} " .
                         ($col_number % 2 ? "{$atts['cssprefix']}_td_odd" : "{$atts['cssprefix']}_td_even") );
            // RH pozor $row_number je pořadový číslo řádku od 1, ale index v poli jde od 0
            $col_extra_class = $rows_td[$row_number-1][$col];
            if ($col_extra_class != '') {
                $col_class .= " {$atts['cssprefix']}_td_{$col}_{$col_extra_class}";
            }
             // RH ZDE DOPLNIT JESTE TRIDU S HODNOTOU  asi jen pro nektere jako status_img, snowmaking, nightskiing, diff_img            
            $output .= '" class="' . $col_class . '">' . $row[$col] . '</td>';
        }
        $output .= '</tr>';
    }

    // DEBUG OK error_log("[HolidayInfo] Table Header + Data Rows: " . PHP_EOL . $output);

    // Summary row
    if (str_contains($atts['flags'], 'addtotalrow')) {
        $row_number++;
        $row_class = esc_attr("{$atts['cssprefix']}_tr {$atts['cssprefix']}_tr_total {$atts['cssprefix']}_tr_{$row_number} " . ($row_number % 2 ? "{$atts['cssprefix']}_tr_odd" : "{$atts['cssprefix']}_tr_even")); 
        $output .= '<tr id="' . esc_attr($atts['idprefix'] . '_tr_total') . '" class="' . $row_class . '">';
        $col_number = 0;
        foreach ($columns as $col) {
            $col_number++;
            $summary_content = match ($col) {
                'id', 'diff_txt', 'diff_img', 'status_img' => '',
                'name' => __('Celkem', 'holiday-info-data'),
                'exceed' => esc_html($TotalExceed) . ' m',
                'length' => esc_html($TotalLength) . ' m',
                'status_txt' => esc_html("$NumOpenSlopes / $NumAllSlopes"),
                'nightskiing' => esc_html("$NumNightSki / $NumAllSlopes"),
                'snowmaking' => esc_html("$NumSnowMaking / $NumAllSlopes"),
                default => ''
            };
            // $output .= '<td class="' . esc_attr($atts['cssprefix'] . '_td_total '. esc_attr($atts['cssprefix'] . '_td ' . $atts['cssprefix'] . '_td_' . $col) . '">' . $summary_content . '</td>';
            $col_class = esc_attr("{$atts['cssprefix']}_td_total {$atts['cssprefix']}_td {$atts['cssprefix']}_td_{$col} {$atts['cssprefix']}_td_{$col_number} " .
                         ($col_number % 2 ? "{$atts['cssprefix']}_td_odd" : "{$atts['cssprefix']}_td_even") );
            // $output .= '<td class="' . $col_class . '">' . $summary_content . '</td>';
            $output .= '<td id="'. esc_attr($atts['idprefix'] . '_td_total_' . $col) . '" class="' . $row_class . '">'. $summary_content . '</td>';
        }
        $output .= '</tr>';
    }

    // Close table
    $output .= '</table>';

    // Close scrollable wrapper if used
    if (str_contains($atts['flags'], 'scrollable')) {
        $output .= '</div>';
    }

     // Close wrapper if used
    if (!str_contains($atts['flags'], 'nohtmlbody')) {
        $output .= '</body></html>';
    }

    // DEBUG OK error_log("[HolidayInfo] Entire Table :" . PHP_EOL . $output);
    
    // DEBUG OK return "<p>Debug: slopes shortcode executed</p>";
    return $output;
}
add_shortcode('slopes', 'hid_shortcode_slopes');


/**
 * Shortcode to generate a dynamic HTML table displaying lifts data.
 * [lifts cssprefix="ski_table" idprefix="ski" columns="name,status_img,capacity,length" flags="addtotalrow"]
 * Basic Table:
 *      [lifts columns="status_img,id,type_img,name,capacity,length"]
 * Table with No Header:
 *      [lifts columns="status_img,id,type_img,name,capacity,length" flags="notablehead"]
 * Table with Custom CSS:
 *      [lifts columns="status_img,name,status_text" cssurl="custom_styles.css"]
 * 
 * 'flags'
 *     - nohtmlbody – potlačení vygenerování „obalového“ html – tj. tagů <html>,<head>, <body>, tj. je vygenerován pouze HTML kód samotné tabulky, ale
 *                    vždy s '<link rel="stylesheet" type="text/css" href="' . esc_attr($atts['cssurl']) . '">' elementem
 *     - notablehead – potlačení prvního řádku tabulky s titulky sloupců
 *     - addtotalrow – přidání posledního řádku se součty u relevantních sloupců
 *     - scrollable  - přidání scrollable div for samll screens
 */
function hid_shortcode_lifts($atts) {
    // Default shortcode attributes
    $atts = shortcode_atts([
        'cssprefix' => 'hol_lifts',
        'idprefix' => 'hol_lifts',
        'columns' => 'id,name,type_txt,type_img,capacity,length,status_txt,status_img,nightskiing',
        'cssurl' => 'css/css_default_lifts.css',
        'flags' => 'nohtmlbody, addtotalrow'
    ], $atts);

    // DEGUG OK error_log("[HolidayInfo] Lifts Attributes: " . print_r($atts, true));

    // Parse columns and remove spaces
    $columns = array_map('trim', explode(',', $atts['columns']));

    error_log("[HolidayInfo] hid_shortcode_lifts Parsed columns: " . implode(', ', $columns));

    // Fetch XML data
    $xml_data = hid_get_actual_xml_record();
    if (!$xml_data) {
        error_log("[HolidayInfo] hid_shortcode_lifts ERROR: No XML data available");
        return __('Error - hid_shortcode_lifts: No XML data is available.', 'holiday-info-data');
    }

    // DEBUG OK error_log("[HolidayInfo] XML data fetched successfully.");

    
    // Parse XML
    $xml = simplexml_load_string($xml_data);
    if (!$xml) {
        error_log("[HolidayInfo] hid_shortcode_lifts ERROR: Failed to parse XML");
        return __('Error: Failed to parse XML data.', 'holiday-info-data');
    }

    // Locate lifts data
    // ERROR $loc_lifts = $xml->xpath("//location/loc_lifts/lift");
    $loc_lifts = $xml->xpath('//location/loc_lifts')[0] ?? null;
    if (!$loc_lifts) {
        error_log("[HolidayInfo] hid_shortcode_lifts ERROR: No <loc_lifts> section found in XML.");
        return __('Error: No lift data found.', 'holiday-info-data');
    }

    // DEBUG OK error_log("[HolidayInfo] hid_shortcode_lifts Found " . count($loc_lifts) . " lifts in XML.");

    // Initialize totals
    $NumAlllifts = 0;
    $NumOpenlifts = 0;
    $NumNightSki = 0;
    
    $Totalcapacity = 0;
    $TotalLength = 0;

    // Process lifts data
    $rows = [];
    $rows_td= [];

    foreach ($loc_lifts as $lift) {
        $NumAlllifts++;

        // Get individual values
        $status_code = (int) $lift->status_code;
        $type_code = (int) $lift->type_code;
        $nightskiing_code = (int) $lift->nightskiing_code;
    

        // Count open lifts
        if (in_array($status_code, [1, 3])) {  // RH for slopes values [2, 6] represent operational 
            $NumOpenlifts++;
        }

        // Count lifts with night skiing
        if ($nightskiing_code == 2) {
            $NumNightSki++;
        }

        // Sum capacity and length
        $Totalcapacity += (int) $lift->capacity;
        $TotalLength += (int) $lift->length;

        // Store row data
        $rows[] = [
            'id' => (string) $lift->id,
            'name' => (string) $lift->name,
            'type_txt' => (string) $lift->type_text,
            'type_img' => '', // Uses CSS for background image
            'capacity' => (int) $lift->capacity . ' os/h',
            'length' => (int) $lift->length . ' m',
            'status_txt' => (string) $lift->status_text,
            'status_img' => '', // Uses CSS for background image
            'nightskiing' => (string) $lift->nightskiing_text
        ];

          // Store row data
          $rows_td[] = [
            'id' => '',
            'name' => '',
            'type_txt' => '',
            'type_img' => (string) $lift->type_code, // Uses CSS for background image
            'capacity' => '',
            'length' => '',
            'status_txt' => '',
            'status_img' => (string) $lift->status_code, // Uses CSS for background image
            'nightskiing' => (string) $lift->nightskiing_code
        ];
    }

    // DEBUG OK error_log("[HolidayInfo] Extracted lifts: " . print_r($rows, true));
    // DEBUG OK error_log("[HolidayInfo] Extracted lifts: " . print_r($rows_td, true));
    
    // Generate table
    $output = '';

   // Add wrapper if not suppressed
    if (!str_contains($atts['flags'], 'nohtmlbody')) {
        $output .= '<html><head>';
        $output .= '<link rel="stylesheet" type="text/css" href="' . plugins_url(esc_attr($atts['cssurl']), __FILE__) . '">';
        $output .= '</head><body>';
    }else {
        // Ensure CSS is still applied even if no HTML wrapper
        // $output .= '<link rel="stylesheet" type="text/css" href="' . plugins_url(esc_attr($atts['cssurl']), __FILE__)  . '">';
        // Enqueue the CSS file for the lifts shortcode using function enqueue_lifts_styles()
    }

    // Add scrollable wrapper for small screens if required
    if (str_contains($atts['flags'], 'scrollable')) {
        $output .= '<div class="table-container">';
    }

    // DEBUG OK error_log("[HolidayInfo] hid_shortcode_lifts Wrapper: " . PHP_EOL . $output);
    
    // Start table
    $alias = HID_DEFAULT_LOCATION['location']['alias'];
    $output .= '<table id="' . esc_attr($atts['idprefix'] . '_tab_' . $alias) . '" class="' . esc_attr($atts['cssprefix'] . '_tab') . '">';

    // Table header if not suppressed
    if (!str_contains($atts['flags'], 'notablehead')) {
        $output .= '<tr id="' . esc_attr($atts['idprefix'] . '_tr_head') . '" class="' . esc_attr($atts['cssprefix'] . '_tr_head') . '">';
        $col_number = 0;
        foreach ($columns as $col) {
            $col_number++;
            $header_content = match ($col) {
                'id' => __('ID', 'holiday-info-data'),
                'name' => __('Lanovka/Vlek', 'holiday-info-data'),
                'type_txt' => __('Typ', 'holiday-info-data'),
                'type_img' => '',
                'capacity' => __('Kapacita', 'holiday-info-data'),
                'length' => __('Délka', 'holiday-info-data'),
                'status_txt' => __('Stav', 'holiday-info-data'),
                'status_img' => '',
                'nightskiing' => __('Več.Lyž.', 'holiday-info-data') ,
                default => ''
            };
            $output .= '<th id="'   . esc_attr($atts['idprefix'] . '_th_' . $col) ;
            $col_class = esc_attr("{$atts['cssprefix']}_th {$atts['cssprefix']}_th_{$col} {$atts['cssprefix']}_th_{$col_number} " .
                                    ($col_number % 2 ? "{$atts['cssprefix']}_th_odd" : "{$atts['cssprefix']}_th_even") );
            $output .= '" class="' . $col_class . '">' . esc_html($header_content) . '</th>';
        }
        $output .= '</tr>';
    }

    // DEBUG OK error_log("[HolidayInfo] hid_shortcode_lifts Table Header: " . PHP_EOL . $output);
    
    // Table data rows
    $row_number = 0;
    foreach ($rows as $row) {
        $row_number++;
        $row_class = esc_attr("{$atts['cssprefix']}_tr {$atts['cssprefix']}_tr_{$row_number} " . ($row_number % 2 ? "{$atts['cssprefix']}_tr_odd" : "{$atts['cssprefix']}_tr_even"));
        $output .= '<tr id="' . esc_attr($atts['idprefix'] . '_tr_' . $row_number) . '" class="' . $row_class . '">';
        $col_number = 0;
        foreach ($columns as $col) {
            $col_number++;
            $output .= '<td id="' . esc_attr($atts['idprefix'] . '_td_' . $row_number) . '_' . $col;
            $col_class = esc_attr("{$atts['cssprefix']}_td {$atts['cssprefix']}_td_{$col} {$atts['cssprefix']}_td_{$col_number} " .
                         ($col_number % 2 ? "{$atts['cssprefix']}_td_odd" : "{$atts['cssprefix']}_td_even") );
            // RH pozor $row_number je pořadový číslo řádku od 1, ale index v poli jde od 0
            $col_extra_class = $rows_td[$row_number-1][$col];
            if ($col_extra_class != '') {
                $col_class .= " {$atts['cssprefix']}_td_{$col}_{$col_extra_class}";
            }
             // RH ZDE DOPLNIT JESTE TRIDU S HODNOTOU  asi jen pro nektere jako status_img, nightskiing, type_img            
            $output .= '" class="' . $col_class . '">' . $row[$col] . '</td>';
        }
        $output .= '</tr>';
    }

    // DEBUG OK error_log("[HolidayInfo] Table Header + Data Rows: " . PHP_EOL . $output);

    // Summary row
    if (str_contains($atts['flags'], 'addtotalrow')) {
        $row_number++;
        $row_class = esc_attr("{$atts['cssprefix']}_tr {$atts['cssprefix']}_tr_total {$atts['cssprefix']}_tr_{$row_number} " . ($row_number % 2 ? "{$atts['cssprefix']}_tr_odd" : "{$atts['cssprefix']}_tr_even")); 
        $output .= '<tr id="' . esc_attr($atts['idprefix'] . '_tr_total') . '" class="' . $row_class . '">';
        $col_number = 0;
        foreach ($columns as $col) {
            $col_number++;
            $summary_content = match ($col) {
                'id', 'type_txt', 'type_img', 'status_img' => '',
                'name' => __('Celkem', 'holiday-info-data'),
                'capacity' => esc_html($Totalcapacity) . ' os/h',
                'length' => esc_html($TotalLength) . ' m',
                'status_txt' => esc_html("$NumOpenlifts / $NumAlllifts"),
                'nightskiing' => esc_html("$NumNightSki / $NumAlllifts"),
                // RH 'snowmaking' => esc_html("$NumSnowMaking / $NumAlllifts"),
                default => ''
            };
            // $output .= '<td class="' . esc_attr($atts['cssprefix'] . '_td_total '. esc_attr($atts['cssprefix'] . '_td ' . $atts['cssprefix'] . '_td_' . $col) . '">' . $summary_content . '</td>';
            $col_class = esc_attr("{$atts['cssprefix']}_td_total {$atts['cssprefix']}_td {$atts['cssprefix']}_td_{$col} {$atts['cssprefix']}_td_{$col_number} " .
                         ($col_number % 2 ? "{$atts['cssprefix']}_td_odd" : "{$atts['cssprefix']}_td_even") );
            // $output .= '<td class="' . $col_class . '">' . $summary_content . '</td>';
            $output .= '<td id="'. esc_attr($atts['idprefix'] . '_td_total_' . $col) . '" class="' . $row_class . '">'. $summary_content . '</td>';
        }
        $output .= '</tr>';
    }

    // Close table
    $output .= '</table>';

    // Close scrollable wrapper if used
    if (str_contains($atts['flags'], 'scrollable')) {
        $output .= '</div>';
    }

     // Close wrapper if used
    if (!str_contains($atts['flags'], 'nohtmlbody')) {
        $output .= '</body></html>';
    }

    error_log("[HolidayInfo] hid_shortcode_lifts Entire Table :" . PHP_EOL . $output);
    
    // DEBUG OK return "<p>Debug: lifts shortcode executed</p>";
    return $output;
}
add_shortcode('lifts', 'hid_shortcode_lifts');





/**
 * Register the Shortcode in WPBakery.
 *  @tag  'loc_info_winter'
 *  name: The name of the element as it will appear in WPBakery's interface.
 *  base: The shortcode tag (loc_info_winter).
 *  description: A brief explanation of the element's purpose.
 *  category: Groups the element in WPBakery under a specific category.
 *  icon: Adds an icon next to the element in the WPBakery interface. You can use a Dashicon (dashicons-snow) or a custom icon class.
 *  params: Defines the options available for the shortcode:
 *   type: A dropdown field to choose between basic and detailed outputs.
 * 
 */
if (function_exists('vc_map')) {
    vc_map([
        'name' => __('Location Info Winter', 'holiday-info-data'),
        'base' => 'loc_info_winter',
        'description' => __('Displays winter information about the location.', 'holiday-info-data'),
        'category' => __('Holiday Info Elements', 'holiday-info-data'),
        'icon' => 'dashicons-snow',
        'params' => [
            [
                'type' => 'dropdown',
                'heading' => __('Type', 'holiday-info-data'),
                'param_name' => 'type',
                'value' => [
                    __('Basic', 'holiday-info-data') => 'basic',
                    __('Detailed', 'holiday-info-data') => 'detailed',
                ],
                'description' => __('Choose the type of information to display.', 'holiday-info-data'),
            ],
        ],
    ]);
}
