# Valetudo Map Card

Display the map from a valetudo-enabled robot in a home assistant dashboard card.

## Installation

It is highly recommended to use [HACS](https://hacs.xyz/) for managing custom extensions of Home Assistant.

Follow the HACS [installation instructions](https://hacs.xyz/docs/installation/prerequisites).

It is necessary to "take control" over the dashboards before downloading the "Valetudo Map Card".
1. Go to the Overview dashboard
2. Click on the pencil-icon on the top right
3. In the dialog click on the three dots on the top right
4. In the context menu click on "take control"
5. In the next dialog click on "take control" again
   
Then, open HACS, go to Frontend and click "Explore & Download Repositories" and search for "Valetudo Map Card". Select it and choose "Download".

## Configuration

### MQTT

This card makes use of [Valetudo's MQTT support](https://valetudo.cloud/pages/integrations/mqtt.html).
MQTT has to be configured in [Home Assistant](https://www.home-assistant.io/docs/mqtt/broker) and [Valetudo](https://valetudo.cloud/pages/integrations/home-assistant-integration.html).

### Custom card

To get the card up and running, head over to [https://hass.valetudo.cloud](https://hass.valetudo.cloud) for a short walkthrough.

## Usage examples

### Displaying with the vacuum entity

![image](https://user-images.githubusercontent.com/974410/198376172-db7a5441-0f5f-429c-8022-fc43d28446b9.png)

For easy control of the vacuum, consider using a vertical-stack with an entities card like so:

```
type: vertical-stack
cards:
  - vacuum: valetudo_thirstyserpentinestingray
    type: custom:valetudo-map-card
  - entities:
      - vacuum.valetudo_thirstyserpentinestingray
    type: entities
```

### Displaying as overlay

When combining this card with Home Assistant's `picture-elements`, you could use this to show your vacuum's position on top of your house. Make sure to set both `show_floor: false` and `background_color: transparent` in this card:

```
type: picture-elements
image: https://online.visual-paradigm.com/repository/images/e5728e49-09ce-4c95-b83c-482deee24386.png
elements:
  - type: 'custom:valetudo-map-card'
    vacuum: valetudo_thirstyserpentinestingray
    show_floor: false
    background_color: transparent
```

Then use map_scale and crop to make it fit.

## Options

| Name                                | Type    | Default                                                             | Description                                                                                                                                                                                                         
|-------------------------------------|---------|---------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
| type                                | string  | **Required**                                                        | `custom:valetudo-map-card`                                                                                                                                                                                          
| vacuum                              | string  | **Required**                                                        | Name of the vacuum in MQTT (without vacuum. prefix)                                                                                                                                                                 
| title                               | string  | Vacuum                                                              | Title to show in the card header                                                                                                                                                                                    
| show_map                            | boolean | true                                                                | Show the map                                                                                                                                                                                                        
| background_color                    | string  |                                                                     | Background color of the card                                                                                                                                                                                        
| floor_color                         | string  | '--valetudo-map-floor-color', '--secondary-background-color'        | Floor color                                                                                                                                                                                                         
| floor_opacity                       | number  | 1                                                                   | Floor opacity                                                                                                                                                                                                       
| wall_color                          | string  | '--valetudo-map-wall-color', '--accent-color'                       | Wall                                                                                                                                                                                                                
| wall_opacity                        | number  | 1                                                                   | Wall opacity                                                                                                                                                                                                        
| currently_cleaned_zone_color        | string  | '--valetudo-currently_cleaned_zone_color', '--secondary-text-color' | Color of zones selected for cleanup                                                                                                                                                                                 
| currently_cleaned_zone_opacity      | number  | 0.5                                                                 | Opacity of the currently cleaned zones                                                                                                                                                                              
| no_go_area_color                    | string  | '--valetudo-no-go-area-color', '--accent-color'                     | No go area color                                                                                                                                                                                                    
| no_go_area_opacity                  | number  | 0.5                                                                 | Opacity of the no go areas                                                                                                                                                                                          
| no_mop_area_color                   | string  | '--valetudo-no-mop-area-color', '--secondary-text-color'            | No mop area color                                                                                                                                                                                                   
| no_mop_area_opacity                 | number  | 0.5                                                                 | Opacity of the no mop areas                                                                                                                                                                                         
| virtual_wall_color                  | string  | '--valetudo-virtual-wall-color', '--accent-color'                   | Virtual wall color                                                                                                                                                                                                  
| virtual_wall_opacity                | number  | 1                                                                   | Virtual wall opacity                                                                                                                                                                                                
| virtual_wall_width                  | number  | 1                                                                   | Virtual wall line width                                                                                                                                                                                             
| path_color                          | string  | '--valetudo-map-path-color', '--primary-text-color'                 | Path color                                                                                                                                                                                                          
| path_opacity                        | number  | 1                                                                   | Path opacity                                                                                                                                                                                                        
| path_width                          | number  | 1                                                                   | Path line width                                                                                                                                                                                                     
| segment_colors                      | array   | '#19A1A1', '#7AC037', '#DF5618', '#F7C841'                          | Segment colors                                                                                                                                                                                                      
| segment_opacity                     | number  | 0.75                                                                | Segment opacity                                                                                                                                                                                                     
| show_floor                          | boolean | true                                                                | Draw the floor on the map                                                                                                                                                                                           
| show_dock                           | boolean | true                                                                | Draw the charging dock on the map                                                                                                                                                                                   
| show_vacuum                         | boolean | true                                                                | Draw the vacuum on the map                                                                                                                                                                                          
| show_walls                          | boolean | true                                                                | Draw walls on the map                                                                                                                                                                                               
| show_currently_cleaned_zones        | boolean | true                                                                | Show zones selected for zoned cleanup on the map                                                                                                                                                                    
| show_no_go_areas                    | boolean | true                                                                | Draw no go areas on the map                                                                                                                                                                                         
| show_no_mop_areas                   | boolean | true                                                                | Draw no mop areas on the map                                                                                                                                                                                        
| show_virtual_walls                  | boolean | true                                                                | Draw virtual walls on the map                                                                                                                                                                                       
| show_path                           | boolean | true                                                                | Draw the path the vacuum took                                                                                                                                                                                       
| show_currently_cleaned_zones_border | boolean | true                                                                | Draw a border around the currently cleaned zones                                                                                                                                                                    
| show_no_go_border                   | boolean | true                                                                | Draw a border around no go areas                                                                                                                                                                                    
| show_no_mop_border                  | boolean | true                                                                | Draw a border around no mop areas                                                                                                                                                                                   
| show_predicted_path                 | boolean | true                                                                | Draw the predicted path for the vacuum                                                                                                                                                                              
| show_goto_target                    | boolean | true                                                                | Draw the go to target                                                                                                                                                                                               
| show_segments                       | boolean | true                                                                | Draw the floor segments on the map                                                                                                                                                                                  
| show_status                         | boolean | true                                                                | Show the status of vacuum_entity                                                                                                                                                                                    
| show_battery_level                  | boolean | true                                                                | Show the battery level of vacuum_entity                                                                                                                                                                             
| show_start_button                   | boolean | true                                                                | Show the start button for vacuum_entity                                                                                                                                                                             
| show_pause_button                   | boolean | true                                                                | Show the pause button for vacuum_entity                                                                                                                                                                             
| show_stop_button                    | boolean | true                                                                | Show the stop button for vacuum_entity                                                                                                                                                                              
| show_home_button                    | boolean | true                                                                | Show the home button for vacuum_entity                                                                                                                                                                              
| show_locate_button                  | boolean | true                                                                | Show the locate button for vacuum_entity                                                                                                                                                                            
| goto_target_icon                    | string  | mdi:pin                                                             | The icon to use for the go to target                                                                                                                                                                                
| goto_target_color                   | string  | 'blue'                                                              | The color to use for the go to target icon                                                                                                                                                                          
| dock_icon                           | string  | mdi:flash                                                           | The icon to use for the charging dock                                                                                                                                                                               
| dock_color                          | string  | 'green'                                                             | The color to use for the charging dock icon                                                                                                                                                                         
| vacuum_icon                         | string  | mdi:robot-vacuum                                                    | The icon to use for the vacuum                                                                                                                                                                                      
| vacuum_color                        | string  | '--primary-text-color'                                              | The color to use for the vacuum icon                                                                                                                                                                                
| map_scale                           | number  | 1                                                                   | Scale the map by this value                                                                                                                                                                                         
| icon_scale                          | number  | 1                                                                   | Scale the icons (vacuum & dock) by this value                                                                                                                                                                       
| rotate                              | number  | 0                                                                   | Value to rotate the map by (default is in deg, but a value like `2rad` is valid too)                                                                                                                                
| left_padding                        | number  | 0                                                                   | Value that moves the map `number` pixels from left to right                                                                                                                                                         
| crop                                | Object  | {top: 0, bottom: 0, left: 0, right: 0}                              | Crop the map                                                                                                                                                                                                        
| min_height                          | string  | 0                                                                   | The minimum height of the card the map is displayed in, regardless of the map's size itself. Suffix with 'w' if you want it to be times the width (ex: 0.5625w is equivalent to a picture card's 16x9 aspect_ratio) 
| custom_buttons                      | array   | []                                                                  | An array of custom buttons. Options detailed below.                                                                                                                                                                 

Colors can be any valid CSS value in the card config, like name (red), hex code (#FF0000), rgb(255,255,255), rgba(255,255,255,0.8)...

## Custom Buttons

Custom buttons can be added to this card when vacuum_entity is set. Each custom button supports the following options:

| Name         | Type   | Default            | Description                                              
|--------------|--------|--------------------|----------------------------------------------------------
| service      | string | **Required**       | The service to call when this button is pressed          
| service_data | Object | {}                 | Optional service data that will be passed to the service 
| icon         | string | mdi:radiobox-blank | The icon that will represent the custom button           
| text         | string | ""                 | Optional text to display next to the icon                

## License

Lovelace Valetudo Map Card is licensed under the MIT license.
