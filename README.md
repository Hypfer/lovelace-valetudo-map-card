# Lovelace Valetudo Map Card

Draws the map from a Xiaomi vacuum cleaner, that is rooted and flashed with [Valetudo](https://github.com/Hypfer/Valetudo), in a [Home Assistant](https://www.home-assistant.io/) Lovelace card.

## Valetudo
Currently, there are 2 big Valetudo projects:

### Valetudo
The original Valetudo, found on https://github.com/Hypfer/Valetudo. For this one, both the MQTT and REST methods are supported. No further tools are necessary.

### Valetudo RE
A popular fork, found on https://github.com/rand256/valetudo. If you want to use this repository with Valetudo RE, you will have to set up [valetudo-mapper](https://github.com/rand256/valetudo-mapper) and set `publishMapData` to `true` in that `/app/config.json`. You will have to use the MQTT configuration for this repository.

## Configuration 

`lovelace.yaml`: Add custom Lovelace configuration in Home Assistant to enable valetudo-map-card JavaScript. Go to your HA overview, then right top "Configure UI", then right top again on the 3 dots and "Raw config editor".
```yaml
resources:
  - type: js
    url: /community_plugin/lovelace-valetudo-map-card/valetudo-map-card.js
```

`configuration.yaml`: Valetudo officially supports MQTT, with the preferred example configuration as follows. Unfortunately Home Assistant does not support authentication via MQTT. See below for a deprecated alternative example configuration using Valetudo's REST API (unsupported) if you prefer not to use MQTT or require authentication.
```yaml
sensor:
  - platform: mqtt
    state_topic: "valetudo/rockrobo/state"
    json_attributes_topic: "valetudo/rockrobo/map_data"
    name: xiaomi_map
    value_template: 'OK'
    scan_interval: 5
```
Note: If you are using Valetudo RE with valetudo-mapper, use `valetudo/rockrobo/map_data_parsed` as `json_attributes_topic` instead.

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

Add Lovelace custom card in HA:
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

It's highly recommended to exclude the sensor from recorder in `configuration.yaml` to keep database small:
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
| entity | string | | Sensor to get state from
| vacuum_entity | string | | Vacuum to show buttons to control for
| floor_color | string | '--valetudo-map-floor-color', '--secondary-background-color' | Floor color
| obstacle_weak_color | string | '--valetudo-map-obstacle-weak-color', '--divider-color' | Weak obstacle color
| obstacle_strong_color | string | '--valetudo-map-obstacle-strong-color', '--accent-color' | Strong obstacle color
| no_go_area_color | string | '--valetudo-no-go-area-color', '--accent-color' | No go area color
| virtual_wall_color | string | '--valetudo-virtual-wall-color', '--accent-color' | Virtual wall color
| virtual_wall_width | number | 1 | Virtual wall line width
| path_color | string | '--valetudo-map-path-color', '--primary-text-color' | Path color
| path_width | number | 1 | Path line width
| show_dock | boolean | true | Draw the charging dock on the map
| show_vacuum | boolean | true | Draw the vacuum on the map
| show_path | boolean | true | Draw the path the vacuum took
| dock_icon | string | mdi:flash | The icon to use for the charging dock
| dock_color | string | 'green' | The color to use for the charging dock icon
| vacuum_icon | string | mdi:robot-vacuum | The icon to use for the vacuum
| vacuum_color | string | '--primary-text-color' | The color to use for the vacuum icon
| map_scale | number | 1 | Scale the map by this value
| icon_scale | number | 1 | Scale the icons (vacuum & dock) by this value
| rotate | number | 0 | Value to rotate the map by (default is in deg, but a value like `2rad` is valid too)
| crop | Object | {top: 0, bottom: 0, left: 0, right: 0} | Crop the map
| min_height | string | 0 | The minimum height of the card the map is displayed in, regardless of the map's size itself. Suffix with 'w' if you want it to be times the width (ex: 0.5625w is equivalent to a picture card's 16x9 aspect_ratio)

Colors can be any valid CSS value in the card config, like name (red), hex code (#FF0000), rgb(255,255,255), rgba(255,255,255,0.8)...
