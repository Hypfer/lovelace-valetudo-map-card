export type HaIconElement = HTMLElement & { icon?: string };

export type RobotInfo = [x: number, y: number, angle?: number];

export type BoundingBox = {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
};

export interface CropConfig {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export interface CustomButtonConfig {
    service: string;
    service_data?: unknown;
    icon?: string;
    text?: string;
}

export interface Configuration {
    vacuum: string;

    // Title settings
    title: string;

    // Core show settings
    show_map: boolean;

    // Map show settings
    show_floor: boolean;
    show_dock: boolean;
    show_vacuum: boolean;
    show_walls: boolean;
    show_currently_cleaned_zones: boolean;
    show_no_go_areas: boolean;
    show_no_mop_areas: boolean;
    show_virtual_walls: boolean;
    show_path: boolean;
    show_currently_cleaned_zones_border: boolean;
    show_no_go_area_border: boolean;
    show_no_mop_area_border: boolean;
    show_predicted_path: boolean;
    show_goto_target: boolean;
    show_segments: boolean;

    // Info show settings
    show_status: boolean;
    show_battery_level: boolean;

    // Show button settings
    show_start_button: boolean;
    show_pause_button: boolean;
    show_stop_button: boolean;
    show_home_button: boolean;
    show_locate_button: boolean;

    // Width settings
    virtual_wall_width: number;
    path_width: number;

    // Padding settings
    left_padding: number;

    // Scale settings
    map_scale: number;
    icon_scale: number;
    rotate: number | string;

    // Opacity settings
    floor_opacity: number;
    segment_opacity: number;
    wall_opacity: number;
    currently_cleaned_zone_opacity: number;
    no_go_area_opacity: number;
    no_mop_area_opacity: number;
    virtual_wall_opacity: number;
    path_opacity: number;

    // Color settings
    background_color: string;
    floor_color: string;
    wall_color: string;
    currently_cleaned_zone_color: string;
    no_go_area_color: string;
    no_mop_area_color: string;
    virtual_wall_color: string;
    path_color: string;
    dock_color: string;
    vacuum_color: string;
    goto_target_color: string;

    // Color segment settings
    segment_colors: string[];

    // Icon settings
    dock_icon: string;
    vacuum_icon: string;
    goto_target_icon: string;

    // Crop settings
    min_height: number | string;
    crop: CropConfig;

    custom_buttons: CustomButtonConfig[];
}
