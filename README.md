# Lovelace Valetudo Map Card

Draws the map available from a Xiaomi Vacuum cleaner flashed with [Valetudo](https://github.com/Hypfer/Valetudo) in a [Home Assistant](https://www.home-assistant.io/) Lovelace card.

## Configuration 

lovelace.yaml:
```yaml
resources:
  - type: js
    url: /community_plugin/lovelace-valetudo-map-card/valetudo-map-card.js
```

configuration.yaml:
```yaml
sensor:
  - platform: mqtt
    state_topic: "valetudo/roborock/state"
    json_attributes_topic: "valetudo/roborock/map_data"
    name: xiaomi_map
    value_template: 'OK'
    scan_interval: 5
    authentication: basic
    username: !secret xiaomi_map_username
    password: !secret xiaomi_map_password
```

`authentication`, `username` and `password` configuration variables are required if using Valetudo Password Authentication (undocumented). Otherwise, omit.

Card:
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

It's highly recommended to exclude the sensor from recorder in configuration.yaml to keep database small:
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
| entity | string | **Required** | Sensor to get state from
| floor_color | string | '--valetudo-map-floor-color', '--secondary-background-color' | Floor color
| obstacle_weak_color | string | '--valetudo-map-obstacle-weak-color', '--divider-color' | Weak obstacle color
| obstacle_strong_color | string | '--valetudo-map-obstacle-strong-color', '--accent-color' | Strong obstacle color
| path_color | string | '--valetudo-map-path-color', '--primary-text-color' | Path color
| show_dock | boolean | true | Draw the charging dock on the map
| show_vacuum | boolean | true | Draw the vacuum on the map
| show_path | boolean | true | Draw the path the vacuum took
| dock_icon | string | mdi:flash | The icon to use for the charging dock
| vacuum_icon | string | mdi:robot-vacuum | The icon to use for the vacuum
| map_scale | number | 1 | Scale the map by this value
| icon_scale | number | 1 | Scale the icons (vacuum & dock) by this value
| rotate | number | 0 | Value to rotate the map by (default is in deg, but a value like `2rad` is valid too)
| crop | Object | {top: 0, bottom: 0, left: 0, right: 0} | Crop the map
| min_height | string | 0 | The minimum height of the card the map is displayed in, regardless of the map's size itself. Suffix with 'w' if you want it to be times the width (ex: 0.5625w is equivalent to a picture card's 16x9 aspect_ratio)
