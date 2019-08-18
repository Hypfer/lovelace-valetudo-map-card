# Lovelace Valetudo Map Card

Draws the map available from a Xiaomi Vacuum cleaner flashed with [Valetudo](https://github.com/Hypfer/Valetudo) in a [Home Assistant](https://www.home-assistant.io/) Lovelace card.

## Configuration 

configuration.yaml:
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
    value_template: 'OK'
```

Card:
```yaml
type: 'custom:valetudo-map-card'
entity: sensor.xiaomi_map
floor_color: 'black'
obstacle_weak_color: 'orange'
obstacle_strong_color: 'red'
path_color: 'white'
```
