# Lovelace Valetudo Map Card

Draws the map from a Xiaomi vacuum cleaner, that is rooted and flashed with [Valetudo](https://github.com/Hypfer/Valetudo), in a [Home Assistant](https://www.home-assistant.io/) Lovelace card.

## Valetudo
Valetudo can be found on https://github.com/Hypfer/Valetudo. This is the only version of Valetudo we officially support.

It is recommended to use at least Valetudo 0.6. Older versions of Valetudo are only supported in "Legacy Mode", which will likely be removed in the future.

## Install

It is highly recommended to use [HACS](https://hacs.xyz/) for managing custom extensions of Home Assistant. It automatically manages the registration of additional resources required by custom cards and makes it easy to keep them up-to-date.

To install HACS follow their [installation instructions](https://hacs.xyz/docs/installation/prerequisites). There is no need to manually add this repository to HACS, just wait for the **Valetudo Map Card** to appear in the **Frontend** Page of the HACS interface in your Home Assistant instance.

## Configuration

When using HACS there is no need to manually make Home Assistant aware of custom javascript resources of this custom card. If you do need to check this manually, it is visible in the **Configuration** -> **Lovelace Dashboards** -> **Resources** tab.

On older versions you may need to add this to the lovelace configuration yaml manually.  
`lovelace.yaml`: Add custom Lovelace configuration in Home Assistant to enable valetudo-map-card JavaScript. Go to your HA overview, then right top "Configure UI", then right top again on the 3 dots and "Raw config editor".
```yaml
resources:
  - type: js
    url: /community_plugin/lovelace-valetudo-map-card/valetudo-map-card.js
```
### Home Assistant
You will need to follow either the instructions for MQTT or for REST. Following the MQTT instructions is strongly recommended as REST is NOT officially supported.

#### MQTT

`configuration.yaml`: Valetudo officially supports MQTT, with the preferred example configuration as follows. You will need to have MQTT configured in [Home Assistant](https://www.home-assistant.io/docs/mqtt/broker) and [Valetudo](https://hypfer.github.io/Valetudo/pages/integrations/home-assistant-integration.html).

Unfortunately Home Assistant does not support authentication via MQTT. See below for a deprecated alternative example configuration using Valetudo's REST API (unsupported) if you prefer not to use MQTT or require authentication.
```yaml
sensor:
  - platform: mqtt
    state_topic: "valetudo/rockrobo/state"
    json_attributes_topic: "valetudo/rockrobo/map_data"
    name: xiaomi_map
    value_template: 'OK'
```

If you are using development version of Valetudo, then you will need to install the [custom_filters](https://github.com/zvldz/ha_custom_filters) component.
You can install it manually or by adding a repository to [HACS](https://hacs.xyz/).

In this case the sensor should look like this:
```yaml
sensor:
  - platform: mqtt
    state_topic: "valetudo/rockrobo/state"
    json_attributes_topic: "valetudo/rockrobo/map_data"
    json_attributes_template: "{% if 'class' in value[1:10] %} {{ value }} {% else %} {{ value | decode_valetudo_map }} {% endif %}"
    name: xiaomi_map
    value_template: 'OK'
```    

This is a temporary solution and may be changed in future

#### Valetudo REST API

Deprecated alternative `configuration.yaml`, using authentication via REST (unsupported):
```yaml
sensor:
  - platform: rest
    resource: http://ip_of_your_vacuum/api/map/latest
    name: xiaomi_map
    json_attributes:
      - image
      - path
      - charger
      - robot
      - virtual_walls
      - no_go_areas
    value_template: 'OK'
    scan_interval: 5
    authentication: basic
    username: !secret xiaomi_map_username
    password: !secret xiaomi_map_password
```

`authentication`, `username` and `password` configuration variables are required if using Valetudo Password Authentication (undocumented). Otherwise, omit.

### Lovelace custom card

Even when installing via HACS, the new card will **not** appear automatically in the list of card previews when hitting the "+" button on the UI. Instead, choose the "Manual" option and provide the following yaml content:

```yaml
type: 'custom:valetudo-map-card'
entity: sensor.xiaomi_map
rotate: 0
crop:
  top: 0
  bottom: 0
  left: 0
  right: 0
min_height: 0
```

Be sure to use the same entity name that you used for the sensor above.

It's also highly recommended to exclude the sensor from the recorder component in `configuration.yaml` to keep the database small:
```yaml
recorder:
  exclude:
    entities:
      - sensor.xiaomi_map
```

## Options
| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | `custom:valetudo-map-card`
| title | string | Vacuum | Title to show in the card header
| entity | string | | Sensor to get state from
| vacuum_entity | string | | Vacuum to show buttons to control for
| background_color | string | | Background color of the card
| floor_color | string | '--valetudo-map-floor-color', '--secondary-background-color' | Floor color
| floor_opacity | number | 1 | Floor opacity
| wall_color | string | '--valetudo-map-wall-color', '--accent-color' | Wall
| wall_opacity | number | 1 | Wall opacity
| currently_cleaned_zone_color | string | '--valetudo-currently_cleaned_zone_color', '--secondary-text-color' | Color of zones selected for cleanup
| currently_cleaned_zone_opacity | number | 0.5 | Opacity of the currently cleaned zones
| no_go_area_color | string | '--valetudo-no-go-area-color', '--accent-color' | No go area color
| no_go_area_opacity | number | 0.5 | Opacity of the no go areas
| virtual_wall_color | string | '--valetudo-virtual-wall-color', '--accent-color' | Virtual wall color
| virtual_wall_opacity | number | 1 | Virtual wall opacity
| virtual_wall_width | number | 1 | Virtual wall line width
| path_color | string | '--valetudo-map-path-color', '--primary-text-color' | Path color
| path_opacity | number | 1 | Path opacity
| path_width | number | 1 | Path line width
| segment_colors | array | '#19A1A1', '#7AC037', '#DF5618', '#F7C841' | Segment colors
| segment_opacity | number | 0.75 | Segment opacity
| show_floor | boolean | true | Draw the floor on the map
| show_dock | boolean | true | Draw the charging dock on the map
| show_vacuum | boolean | true | Draw the vacuum on the map
| show_walls | boolean | true | Draw walls on the map
| show_currently_cleaned_zones | boolean | true | Show zones selected for zoned cleanup on the map
| show_no_go_areas | boolean | true | Draw no go areas on the map
| show_virtual_walls | boolean | true | Draw virtual walls on the map
| show_path | boolean | true | Draw the path the vacuum took
| show_no_go_border | boolean | true | Draw a border around no go areas
| show_predicted_path | boolean | true | Draw the predicted path for the vacuum
| show_goto_target | boolean | true | Draw the go to target
| show_segments | boolean | true | Draw the floor segments on the map
| show_status | boolean | true | Show the status of vacuum_entity
| show_battery_level | boolean | true | Show the battery level of vacuum_entity
| show_start_button | boolean | true | Show the start button for vacuum_entity
| show_pause_button | boolean | true | Show the pause button for vacuum_entity
| show_stop_button | boolean | true | Show the stop button for vacuum_entity
| show_home_button | boolean | true | Show the home button for vacuum_entity
| goto_target_icon | string | mdi:pin | The icon to use for the go to target
| goto_target_color | string | 'blue' | The color to use for the go to target icon
| dock_icon | string | mdi:flash | The icon to use for the charging dock
| dock_color | string | 'green' | The color to use for the charging dock icon
| vacuum_icon | string | mdi:robot-vacuum | The icon to use for the vacuum
| vacuum_color | string | '--primary-text-color' | The color to use for the vacuum icon
| map_scale | number | 1 | Scale the map by this value
| icon_scale | number | 1 | Scale the icons (vacuum & dock) by this value
| rotate | number | 0 | Value to rotate the map by (default is in deg, but a value like `2rad` is valid too)
| crop | Object | {top: 0, bottom: 0, left: 0, right: 0} | Crop the map
| min_height | string | 0 | The minimum height of the card the map is displayed in, regardless of the map's size itself. Suffix with 'w' if you want it to be times the width (ex: 0.5625w is equivalent to a picture card's 16x9 aspect_ratio)
| custom_buttons | array | [] | An array of custom buttons. Options detailed below.

Colors can be any valid CSS value in the card config, like name (red), hex code (#FF0000), rgb(255,255,255), rgba(255,255,255,0.8)...

## Custom Buttons
Custom buttons can be added to this card when vacuum_entity is set. Each custom button supports the following options:

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| service | sting | **Required** | The service to call when this button is pressed
| service_data | Object | {} | Optional service data that will be passed to the service
| icon | string | mdi:radiobox-blank | The icon that will represent the custom button

## Tips & Tricks
### Displaying as overlay
When combining this card with Home Assistant's `picture-elements`, you could use this to show your vacuum's position on top of your house. Make sure to set both `show_floor: false` and `background_color: transparent` in this card:

```
type: picture-elements
image: https://online.visual-paradigm.com/repository/images/e5728e49-09ce-4c95-b83c-482deee24386.png
elements:
  - type: 'custom:valetudo-map-card'
    entity: sensor.xiaomi_map
    show_floor: false
    background_color: transparent
```

Then use map_scale and crop to make it fit.

## License
Lovelace Valetudo Map Card is licensed under the MIT license. It includes some code from [the Valetudo project](https://github.com/Hypfer/Valetudo), which is available under the Apache 2 license. This third-party code is clearly marked as such.
