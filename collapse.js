function drupal_add_js($data = NULL, $options = NULL) {
  $javascript = &drupal_static(__FUNCTION__, array());
  $jquery_added = &drupal_static(__FUNCTION__ . ':jquery_added', FALSE);

  // If the $javascript variable has been reset with drupal_static_reset(),
  // jQuery and related files will have been removed from the list, so set the
  // variable back to FALSE to indicate they have not yet been added.
  if (empty($javascript)) {
    $jquery_added = FALSE;
  }

  // Construct the options, taking the defaults into consideration.
  if (isset($options)) {
    if (!is_array($options)) {
      $options = array('type' => $options);
    }
  }
  else {
    $options = array();
  }
  if (isset($options ['type']) && $options ['type'] == 'setting') {
    $options += array('requires_jquery' => FALSE);
  }
  $options += drupal_js_defaults($data);

  // Preprocess can only be set if caching is enabled.
  $options ['preprocess'] = $options ['cache'] ? $options ['preprocess'] : FALSE;

  // Tweak the weight so that files of the same weight are included in the
  // order of the calls to drupal_add_js().
  $options ['weight'] += count($javascript) / 1000;

  if (isset($data)) {
    // Add jquery.js, drupal.js, and related files and settings if they have
    // not been added yet. However, if the 'javascript_always_use_jquery'
    // variable is set to FALSE (indicating that the site does not want jQuery
    // automatically added on all pages) then only add it if a file or setting
    // that requires jQuery is being added also.
    if (!$jquery_added && (variable_get('javascript_always_use_jquery', TRUE) || $options ['requires_jquery'])) {
      $jquery_added = TRUE;
      // url() generates the prefix using hook_url_outbound_alter(). Instead of
      // running the hook_url_outbound_alter() again here, extract the prefix
      // from url().
      url('', array('prefix' => &$prefix));
      $default_javascript = array(
        'settings' => array(
          'data' => array(
            array('basePath' => base_path()),
            array('pathPrefix' => empty($prefix) ? '' : $prefix),
          ),
          'type' => 'setting',
          'scope' => 'header',
          'group' => JS_LIBRARY,
          'every_page' => TRUE,
          'weight' => 0,
        ),
        'misc/drupal.js' => array(
          'data' => 'misc/drupal.js',
          'type' => 'file',
          'scope' => 'header',
          'group' => JS_LIBRARY,
          'every_page' => TRUE,
          'weight' => -1,
          'requires_jquery' => TRUE,
          'preprocess' => TRUE,
          'cache' => TRUE,
          'defer' => FALSE,
        ),
      );
      $javascript = drupal_array_merge_deep($javascript, $default_javascript);
      // Register all required libraries.
      drupal_add_library('system', 'jquery', TRUE);
      drupal_add_library('system', 'jquery.once', TRUE);
    }

    switch ($options ['type']) {
      case 'setting':
        // All JavaScript settings are placed in the header of the page with
        // the library weight so that inline scripts appear afterwards.
        $javascript ['settings']['data'][] = $data;
        break;

      case 'inline':
        $javascript [] = $options;
        break;

      default: // 'file' and 'external'
        // Local and external files must keep their name as the associative key
        // so the same JavaScript file is not added twice.
        $javascript [$options ['data']] = $options;
    }
  }
  return $javascript;
}