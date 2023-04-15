export const DEFAULT_CARD_CONFIG = Object.freeze({
    // Title settings
    title: "Vacuum",

    // Core show settings
    show_map: true,

    // Map show settings
    show_floor: true,
    show_dock: true,
    show_vacuum: true,
    show_walls: true,
    show_currently_cleaned_zones: true,
    show_no_go_areas: true,
    show_no_mop_areas: true,
    show_virtual_walls: true,
    show_path: true,
    show_currently_cleaned_zones_border: true,
    show_no_go_area_border: true,
    show_no_mop_area_border: true,
    show_predicted_path: true,
    show_goto_target: true,
    show_segments: true,

    // Info show settings
    show_status: true,
    show_battery_level: true,

    // Show button settings
    show_start_button: true,
    show_pause_button: true,
    show_stop_button: true,
    show_home_button: true,
    show_locate_button: true,

    // Width settings
    virtual_wall_width: 1,
    path_width: 1,

    // Padding settings
    left_padding: 0,

    // Scale settings
    map_scale: 1,
    icon_scale: 1,

    // Opacity settings
    floor_opacity: 1,
    segment_opacity: 0.75,
    wall_opacity: 1,
    currently_cleaned_zone_opacity: 0.5,
    no_go_area_opacity: 0.5,
    no_mop_area_opacity: 0.5,
    virtual_wall_opacity: 1,
    path_opacity: 1,

    // Color segment settings
    segment_colors: [
        "#19A1A1",
        "#7AC037",
        "#DF5618",
        "#F7C841",
    ],

    // Crop settings
    min_height: 0
});

export const POLL_INTERVAL_STATE_MAP = Object.freeze({
    "cleaning": 3*1000,
    "paused": 15*1000,
    "idle": 2*60*1000,
    "returning": 3*1000,
    "docked": 2*60*1000,
    "error": 2*60*1000
});
