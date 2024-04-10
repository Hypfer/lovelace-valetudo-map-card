import {FourColorTheoremSolver} from "./ts-lib/colors/FourColorTheoremSolver";
import * as pako from "pako";
import {extractZtxtPngChunks} from "./lib/pngUtils";
import {DEFAULT_CARD_CONFIG, POLL_INTERVAL_STATE_MAP} from "./res/consts";
import {preprocessMap} from "./ts-lib/mapUtils";
import packageJson from "../package.json";

console.info(
    `%c   Valetudo-Map-Card   \n%c   Version ${packageJson.version}   `,
    "color: #0076FF; font-weight: bold; background: #121212",
    "color: #52AEFF; font-weight: bold; background: #1e1e1e"
);

class ValetudoMapCard extends HTMLElement {
    constructor() {
        super();

        this.drawingMap = false;
        this.drawingControls = false;
        this.lastUpdatedControls = "";
        this.attachShadow({ mode: "open" });
        this.lastMapPoll = new Date(0);
        this.isPollingMap = false;
        this.lastRobotState = "docked";
        this.pollInterval = POLL_INTERVAL_STATE_MAP["cleaning"];

        this.cardContainer = document.createElement("ha-card");
        this.cardContainer.id = "valetudoMapCard";
        this.cardContainerStyle = document.createElement("style");
        this.shadowRoot.appendChild(this.cardContainer);
        this.shadowRoot.appendChild(this.cardContainerStyle);

        this.cardHeader = document.createElement("div");
        this.cardHeader.setAttribute("class", "card-header");
        this.cardTitle = document.createElement("div");
        this.cardTitle.setAttribute("class", "name");
        this.cardHeader.appendChild(this.cardTitle);
        this.cardContainer.appendChild(this.cardHeader);

        this.entityWarning1 = document.createElement("hui-warning");
        this.entityWarning1.id = "valetudoMapCardWarning1";
        this.entityWarning1.style.display = "none";
        this.cardContainer.appendChild(this.entityWarning1);

        this.entityWarning2 = document.createElement("hui-warning");
        this.entityWarning2.id = "valetudoMapCardWarning2";
        this.entityWarning2.style.display = "none";
        this.cardContainer.appendChild(this.entityWarning2);

        this.mapContainer = document.createElement("div");
        this.mapContainer.id = "valetudoMapCardMapContainer";
        this.mapContainerStyle = document.createElement("style");
        this.cardContainer.appendChild(this.mapContainer);
        this.cardContainer.appendChild(this.mapContainerStyle);

        this.controlContainer = document.createElement("div");
        this.controlContainer.id = "valetudoMapCardControlsContainer";
        this.controlContainerStyle = document.createElement("style");
        this.cardContainer.appendChild(this.controlContainer);
        this.cardContainer.appendChild(this.controlContainerStyle);
    }

    static getStubConfig() {
        return { vacuum: "valetudo_REPLACEME" };
    }

    getMapEntityName(vacuum_name) {
        return "camera." + vacuum_name + "_map_data";
    }

    getVacuumEntityName(vacuum_name) {
        return "vacuum." + vacuum_name;
    }

    getMapEntity(vacuum_name) {
        return this._hass.states[this.getMapEntityName(vacuum_name)];
    }

    getVacuumEntity(vacuum_name) {
        return this._hass.states[this.getVacuumEntityName(vacuum_name)];
    }

    shouldDrawMap() {
        return !this.drawingMap;
    }

    shouldDrawControls(state) {
        return !this.drawingControls && this.lastUpdatedControls !== state.last_updated;
    }

    calculateColor(container, ...colors) {
        for (let color of colors) {
            if (!color) {
                continue;
            }
            if (color.startsWith("--")) {
                let possibleColor = getComputedStyle(container).getPropertyValue(color);
                if (!possibleColor) {
                    continue;
                }
                return possibleColor;
            }
            return color;
        }
    }

    isOutsideBounds(x, y, drawnMapCanvas, config) {
        return (x < this._config.crop.left) || (x > drawnMapCanvas.width) || (y < config.crop.top) || (y > drawnMapCanvas.height);
    }

    getLayers(attributes, type, maxCount) {
        let layers = [];
        for (let layer of attributes.layers) {
            if (layer.type === type) {
                layers.push(layer);
            }

            if (layers.length === maxCount) {
                break;
            }
        }

        return layers;
    }

    getEntities(attributes, type, maxCount) {
        let entities = [];
        for (let entity of attributes.entities) {
            if (entity.type === type) {
                entities.push(entity);
            }

            if (maxCount && entities.length === maxCount) {
                break;
            }
        }

        return entities;
    }

    getChargerInfo(attributes) {
        let layer = this.getEntities(attributes, "charger_location", 1)[0];
        if (layer === undefined) {
            return null;
        }

        return [layer.points[0], layer.points[1]];
    }

    getRobotInfo(attributes) {
        let layer = this.getEntities(attributes, "robot_position", 1)[0];
        if (layer === undefined) {
            return null;
        }

        return [layer.points[0], layer.points[1], layer.metaData.angle];
    }

    getGoToInfo(attributes) {

        let layer = this.getEntities(attributes, "go_to_target", 1)[0];
        if (layer === undefined) {
            return null;
        }

        return [layer.points[0], layer.points[1]];

    }

    getFloorPoints(attributes, ) {

        let layer = this.getLayers(attributes, "floor", 1)[0];
        if (layer === undefined) {
            return null;
        }

        return layer.pixels;

    }

    getSegments(attributes) {

        return this.getLayers(attributes, "segment");

    }

    getWallPoints(attributes) {
        let layer = this.getLayers(attributes, "wall", 1)[0];
        if (layer === undefined) {
            return null;
        }

        return layer.pixels;
    }

    getVirtualWallPoints(attributes) {
        return this.getEntities(attributes, "virtual_wall");
    }

    getPathPoints(attributes) {
        return this.getEntities(attributes, "path");
    }

    getPredictedPathPoints(attributes) {
        return this.getEntities(attributes, "predicted_path");
    }

    getActiveZones(attributes) {
        return this.getEntities(attributes, "active_zone");
    }

    getNoGoAreas(attributes) {
        return this.getEntities(attributes, "no_go_area");
    }

    getNoMopAreas(attributes) {
        return this.getEntities(attributes, "no_mop_area");
    }

    drawMap(attributes, mapHeight, mapWidth, boundingBox) {
        const pixelSize = attributes.pixelSize;

        const widthScale = pixelSize / this._config.map_scale;
        const heightScale = pixelSize / this._config.map_scale;

        let objectLeftOffset = 0;
        let objectTopOffset = 0;
        let mapLeftOffset = 0;
        let mapTopOffset = 0;

        mapLeftOffset = ((boundingBox.minX) - 1) * this._config.map_scale;
        mapTopOffset = ((boundingBox.minY) - 1) * this._config.map_scale;

        // Calculate colours
        const homeAssistant = document.getElementsByTagName("home-assistant")[0];
        const floorColor = this.calculateColor(homeAssistant, this._config.floor_color, "--valetudo-map-floor-color", "--secondary-background-color");
        const wallColor = this.calculateColor(homeAssistant, this._config.wall_color, "--valetudo-map-wall-color", "--accent-color");
        const currentlyCleanedZoneColor = this.calculateColor(homeAssistant, this._config.currently_cleaned_zone_color, "--valetudo-currently_cleaned_zone_color", "--secondary-text-color");
        const noGoAreaColor = this.calculateColor(homeAssistant, this._config.no_go_area_color, "--valetudo-no-go-area-color", "--accent-color");
        const noMopAreaColor = this.calculateColor(homeAssistant, this._config.no_mop_area_color, "--valetudo-no-mop-area-color", "--secondary-text-color");
        const virtualWallColor = this.calculateColor(homeAssistant, this._config.virtual_wall_color, "--valetudo-virtual-wall-color", "--accent-color");
        const pathColor = this.calculateColor(homeAssistant, this._config.path_color, "--valetudo-map-path-color", "--primary-text-color");
        const chargerColor = this.calculateColor(homeAssistant, this._config.dock_color, "green");
        const vacuumColor = this.calculateColor(homeAssistant, this._config.vacuum_color, "--primary-text-color");
        const gotoTargetColor = this.calculateColor(homeAssistant, this._config.goto_target_color, "blue");

        // Create all objects
        const containerContainer = document.createElement("div");
        containerContainer.id = "lovelaceValetudoCard";

        const drawnMapContainer = document.createElement("div");
        const drawnMapCanvas = document.createElement("canvas");
        drawnMapCanvas.width = mapWidth * this._config.map_scale;
        drawnMapCanvas.height = mapHeight * this._config.map_scale;
        drawnMapContainer.style.zIndex = 1;
        drawnMapContainer.appendChild(drawnMapCanvas);

        const chargerContainer = document.createElement("div");
        const chargerHTML = document.createElement("ha-icon");
        let chargerInfo = this.getChargerInfo(attributes);
        if (this._config.show_dock && chargerInfo) {
            chargerHTML.style.position = "absolute"; // Needed in Home Assistant 0.110.0 and up
            chargerHTML.icon = this._config.dock_icon || "mdi:flash";
            chargerHTML.style.left = `${Math.floor(chargerInfo[0] / widthScale) - objectLeftOffset - mapLeftOffset - (12 * this._config.icon_scale)}px`;
            chargerHTML.style.top = `${Math.floor(chargerInfo[1] / heightScale) - objectTopOffset - mapTopOffset - (12 * this._config.icon_scale)}px`;
            chargerHTML.style.color = chargerColor;
            chargerHTML.style.transform = `scale(${this._config.icon_scale}, ${this._config.icon_scale}) rotate(-${this._config.rotate})`;
        }
        chargerContainer.style.zIndex = 2;
        chargerContainer.appendChild(chargerHTML);

        const pathContainer = document.createElement("div");
        const pathCanvas = document.createElement("canvas");
        pathCanvas.width = mapWidth * this._config.map_scale;
        pathCanvas.height = mapHeight * this._config.map_scale;
        pathContainer.style.zIndex = 3;
        pathContainer.appendChild(pathCanvas);

        const vacuumContainer = document.createElement("div");
        const vacuumHTML = document.createElement("ha-icon");

        let robotInfo = this.getRobotInfo(attributes);
        if (!robotInfo) {
            robotInfo = this.lastValidRobotInfo;
        }

        if (this._config.show_vacuum && robotInfo) {
            this.lastValidRobotInfo = robotInfo;
            vacuumHTML.style.position = "absolute"; // Needed in Home Assistant 0.110.0 and up
            vacuumHTML.icon = this._config.vacuum_icon || "mdi:robot-vacuum";
            vacuumHTML.style.color = vacuumColor;
            vacuumHTML.style.left = `${Math.floor(robotInfo[0] / widthScale) - objectLeftOffset - mapLeftOffset - (12 * this._config.icon_scale)}px`;
            vacuumHTML.style.top = `${Math.floor(robotInfo[1] / heightScale) - objectTopOffset - mapTopOffset - (12 * this._config.icon_scale)}px`;
            vacuumHTML.style.transform = `scale(${this._config.icon_scale}, ${this._config.icon_scale})`;
        }
        vacuumContainer.style.zIndex = 4;
        vacuumContainer.appendChild(vacuumHTML);

        const goToTargetContainer = document.createElement("div");
        const goToTargetHTML = document.createElement("ha-icon");
        let goToInfo = this.getGoToInfo(attributes);
        if (this._config.show_goto_target && goToInfo) {
            goToTargetHTML.style.position = "absolute"; // Needed in Home Assistant 0.110.0 and up
            goToTargetHTML.icon = this._config.goto_target_icon || "mdi:pin";
            goToTargetHTML.style.left = `${Math.floor(goToInfo[0] / widthScale) - objectLeftOffset - mapLeftOffset - (12 * this._config.icon_scale)}px`;
            goToTargetHTML.style.top = `${Math.floor(goToInfo[1] / heightScale) - objectTopOffset - mapTopOffset - (22 * this._config.icon_scale)}px`;
            goToTargetHTML.style.color = gotoTargetColor;
            goToTargetHTML.style.transform = `scale(${this._config.icon_scale}, ${this._config.icon_scale})`;
        }
        goToTargetContainer.style.zIndex = 5;
        goToTargetContainer.appendChild(goToTargetHTML);

        // Put objects in container
        containerContainer.appendChild(drawnMapContainer);
        containerContainer.appendChild(chargerContainer);
        containerContainer.appendChild(pathContainer);
        containerContainer.appendChild(vacuumContainer);
        containerContainer.appendChild(goToTargetContainer);

        const mapCtx = drawnMapCanvas.getContext("2d");
        if (this._config.show_floor) {
            mapCtx.globalAlpha = this._config.floor_opacity;

            mapCtx.strokeStyle = floorColor;
            mapCtx.lineWidth = 1;
            mapCtx.fillStyle = floorColor;
            mapCtx.beginPath();
            let floorPoints = this.getFloorPoints(attributes);
            if (floorPoints) {
                for (let i = 0; i < floorPoints.length; i+=2) {
                    let x = (floorPoints[i] * this._config.map_scale) - mapLeftOffset;
                    let y = (floorPoints[i + 1] * this._config.map_scale) - mapTopOffset;
                    if (this.isOutsideBounds(x, y, drawnMapCanvas, this._config)) {
                        continue;
                    }
                    mapCtx.fillRect(x, y, this._config.map_scale, this._config.map_scale);
                }
            }

            mapCtx.globalAlpha = 1;
        }

        let segmentAreas = this.getSegments(attributes);
        if (segmentAreas && this._config.show_segments) {
            const colorFinder = new FourColorTheoremSolver(segmentAreas, 6);
            mapCtx.globalAlpha = this._config.segment_opacity;

            for (let item of segmentAreas) {
                mapCtx.strokeStyle = this._config.segment_colors[colorFinder.getColor(item.metaData.segmentId)];
                mapCtx.lineWidth = 1;
                mapCtx.fillStyle = this._config.segment_colors[colorFinder.getColor(item.metaData.segmentId)];
                mapCtx.beginPath();
                let segmentPoints = item["pixels"];
                if (segmentPoints) {
                    for (let i = 0; i < segmentPoints.length; i+=2) {
                        let x = (segmentPoints[i] * this._config.map_scale) - mapLeftOffset;
                        let y = (segmentPoints[i + 1] * this._config.map_scale) - mapTopOffset;
                        if (this.isOutsideBounds(x, y, drawnMapCanvas, this._config)) {
                            continue;
                        }
                        mapCtx.fillRect(x, y, this._config.map_scale, this._config.map_scale);
                    }
                }
            }

            mapCtx.globalAlpha = 1;
        }

        if (this._config.show_walls) {
            mapCtx.globalAlpha = this._config.wall_opacity;

            mapCtx.strokeStyle = wallColor;
            mapCtx.lineWidth = 1;
            mapCtx.fillStyle = wallColor;
            mapCtx.beginPath();
            let wallPoints = this.getWallPoints(attributes);
            if (wallPoints) {
                for (let i = 0; i < wallPoints.length; i+=2) {
                    let x = (wallPoints[i] * this._config.map_scale) - mapLeftOffset;
                    let y = (wallPoints[i + 1] * this._config.map_scale) - mapTopOffset;
                    if (this.isOutsideBounds(x, y, drawnMapCanvas, this._config)) {
                        continue;
                    }
                    mapCtx.fillRect(x, y, this._config.map_scale, this._config.map_scale);
                }
            }

            mapCtx.globalAlpha = 1;
        }

        let activeZones = this.getActiveZones(attributes);
        if (Array.isArray(activeZones) && activeZones.length > 0 && this._config.show_currently_cleaned_zones) {
            mapCtx.globalAlpha = this._config.currently_cleaned_zone_opacity;

            mapCtx.strokeStyle = currentlyCleanedZoneColor;
            mapCtx.lineWidth = 2;
            mapCtx.fillStyle = currentlyCleanedZoneColor;
            for (let item of activeZones) {
                mapCtx.globalAlpha = this._config.currently_cleaned_zone_opacity;
                mapCtx.beginPath();
                let points = item["points"];
                for (let i = 0; i < points.length; i+=2) {
                    let x = Math.floor(points[i] / widthScale) - objectLeftOffset - mapLeftOffset;
                    let y = Math.floor(points[i + 1] / heightScale) - objectTopOffset - mapTopOffset;
                    if (i === 0) {
                        mapCtx.moveTo(x, y);
                    } else {
                        mapCtx.lineTo(x, y);
                    }
                    if (this.isOutsideBounds(x, y, drawnMapCanvas, this._config)) {
                        // noinspection UnnecessaryContinueJS
                        continue;
                    }
                }
                mapCtx.fill();

                if (this._config.show_currently_cleaned_zones_border) {
                    mapCtx.closePath();
                    mapCtx.globalAlpha = 1.0;
                    mapCtx.stroke();
                }
            }
            mapCtx.globalAlpha = 1.0;
        }

        let noGoAreas = this.getNoGoAreas(attributes);
        if (noGoAreas && this._config.show_no_go_areas) {
            mapCtx.strokeStyle = noGoAreaColor;
            mapCtx.lineWidth = 2;
            mapCtx.fillStyle = noGoAreaColor;
            for (let item of noGoAreas) {
                mapCtx.globalAlpha = this._config.no_go_area_opacity;
                mapCtx.beginPath();
                let points = item["points"];
                for (let i = 0; i < points.length; i+=2) {
                    let x = Math.floor(points[i] / widthScale) - objectLeftOffset - mapLeftOffset;
                    let y = Math.floor(points[i + 1] / heightScale) - objectTopOffset - mapTopOffset;
                    if (i === 0) {
                        mapCtx.moveTo(x, y);
                    } else {
                        mapCtx.lineTo(x, y);
                    }
                    if (this.isOutsideBounds(x, y, drawnMapCanvas, this._config)) {
                        // noinspection UnnecessaryContinueJS
                        continue;
                    }
                }
                mapCtx.fill();

                if (this._config.show_no_go_area_border) {
                    mapCtx.closePath();
                    mapCtx.globalAlpha = 1.0;
                    mapCtx.stroke();
                }
            }
            mapCtx.globalAlpha = 1.0;
        }

        let noMopAreas = this.getNoMopAreas(attributes);
        if (noMopAreas && this._config.show_no_mop_areas) {
            mapCtx.strokeStyle = noMopAreaColor;
            mapCtx.lineWidth = 2;
            mapCtx.fillStyle = noMopAreaColor;
            for (let item of noMopAreas) {
                mapCtx.globalAlpha = this._config.no_mop_area_opacity;
                mapCtx.beginPath();
                let points = item["points"];
                for (let i = 0; i < points.length; i+=2) {
                    let x = Math.floor(points[i] / widthScale) - objectLeftOffset - mapLeftOffset;
                    let y = Math.floor(points[i + 1] / heightScale) - objectTopOffset - mapTopOffset;
                    if (i === 0) {
                        mapCtx.moveTo(x, y);
                    } else {
                        mapCtx.lineTo(x, y);
                    }
                    if (this.isOutsideBounds(x, y, drawnMapCanvas, this._config)) {
                        // noinspection UnnecessaryContinueJS
                        continue;
                    }
                }
                mapCtx.fill();

                if (this._config.show_no_mop_area_border) {
                    mapCtx.closePath();
                    mapCtx.globalAlpha = 1.0;
                    mapCtx.stroke();
                }
            }
            mapCtx.globalAlpha = 1.0;
        }

        let virtualWallPoints = this.getVirtualWallPoints(attributes);
        if (virtualWallPoints && this._config.show_virtual_walls && this._config.virtual_wall_width > 0) {
            mapCtx.globalAlpha = this._config.virtual_wall_opacity;

            mapCtx.strokeStyle = virtualWallColor;
            mapCtx.lineWidth = this._config.virtual_wall_width;
            mapCtx.beginPath();
            for (let item of virtualWallPoints) {
                let fromX = Math.floor(item["points"][0] / widthScale) - objectLeftOffset - mapLeftOffset;
                let fromY = Math.floor(item["points"][1] / heightScale) - objectTopOffset - mapTopOffset;
                let toX = Math.floor(item["points"][2] / widthScale) - objectLeftOffset - mapLeftOffset;
                let toY = Math.floor(item["points"][3] / heightScale) - objectTopOffset - mapTopOffset;
                if (this.isOutsideBounds(fromX, fromY, drawnMapCanvas, this._config)) {
                    continue;
                }
                if (this.isOutsideBounds(toX, toY, drawnMapCanvas, this._config)) {
                    continue;
                }
                mapCtx.moveTo(fromX, fromY);
                mapCtx.lineTo(toX, toY);
                mapCtx.stroke();
            }

            mapCtx.globalAlpha = 1;
        }

        const pathCtx = pathCanvas.getContext("2d");
        pathCtx.globalAlpha = this._config.path_opacity;
        pathCtx.strokeStyle = pathColor;
        pathCtx.lineWidth = this._config.path_width;

        let pathPoints = this.getPathPoints(attributes);
        if (Array.isArray(pathPoints) && pathPoints.length > 0 && (this._config.show_path && this._config.path_width > 0)) {
            for (let item of pathPoints) {
                let x = 0;
                let y = 0;
                let first = true;
                pathCtx.beginPath();
                for (let i = 0; i < item.points.length; i+=2) {
                    x = Math.floor((item.points[i]) / widthScale) - objectLeftOffset - mapLeftOffset;
                    y = Math.floor((item.points[i + 1]) / heightScale) - objectTopOffset - mapTopOffset;
                    if (this.isOutsideBounds(x, y, drawnMapCanvas, this._config)) {
                        continue;
                    }
                    if (first) {
                        pathCtx.moveTo(x, y);
                        first = false;
                    } else {
                        pathCtx.lineTo(x, y);
                    }
                }
                pathCtx.stroke();
            }

            // Update vacuum angle
            vacuumHTML.style.transform = `scale(${this._config.icon_scale}, ${this._config.icon_scale}) rotate(${robotInfo[2]}deg)`;

            pathCtx.globalAlpha = 1;
        }

        let predictedPathPoints = this.getPredictedPathPoints(attributes);
        if (Array.isArray(predictedPathPoints) && predictedPathPoints.length > 0 && (this._config.show_predicted_path && this._config.path_width > 0)) {
            pathCtx.setLineDash([5,3]);
            for (let item of predictedPathPoints) {
                let x = 0;
                let y = 0;
                let first = true;
                pathCtx.beginPath();
                for (let i = 0; i < item.points.length; i+=2) {
                    x = Math.floor((item.points[i]) / widthScale) - objectLeftOffset - mapLeftOffset;
                    y = Math.floor((item.points[i + 1]) / heightScale) - objectTopOffset - mapTopOffset;
                    if (this.isOutsideBounds(x, y, drawnMapCanvas, this._config)) {
                        continue;
                    }
                    if (first) {
                        pathCtx.moveTo(x, y);
                        first = false;
                    } else {
                        pathCtx.lineTo(x, y);
                    }
                }
                pathCtx.stroke();
            }

            pathCtx.globalAlpha = 1;
        }

        // Put our newly generated map in there
        this.clearContainer(this.mapContainer);
        this.mapContainer.appendChild(containerContainer);
    }

    clearContainer(container) {
        while (container.firstChild) {
            container.firstChild.remove();
        }
    }

    drawControls(infoEntity) {
    // Start drawing controls
        this.drawingControls = true;

        this.infoBox = document.createElement("div");
        this.infoBox.classList.add("flex-box");

        if (infoEntity && infoEntity.state && this._config.show_status) {
            const statusInfo = document.createElement("p");
            statusInfo.innerHTML = infoEntity.state[0].toUpperCase() + infoEntity.state.substring(1);
            this.infoBox.appendChild(statusInfo);
        }

        if (infoEntity && infoEntity.attributes && infoEntity.attributes.battery_icon && infoEntity.attributes.battery_level && this._config.show_battery_level) {
            const batteryData = document.createElement("div");
            batteryData.style.display = "flex";
            batteryData.style.alignItems = "center";
            const batteryIcon = document.createElement("ha-icon");
            const batteryText = document.createElement("span");
            batteryIcon.icon = infoEntity.attributes.battery_icon;
            batteryText.innerHTML = " " + infoEntity.attributes.battery_level + " %";
            batteryData.appendChild(batteryIcon);
            batteryData.appendChild(batteryText);
            this.infoBox.appendChild(batteryData);
        }

        this.controlFlexBox = document.createElement("div");
        this.controlFlexBox.classList.add("flex-box");

        // Create controls
        if (this._config.show_start_button && this.shouldDisplayButton("start", infoEntity.state)) {
            const startButton = document.createElement("paper-button");
            const startIcon = document.createElement("ha-icon");
            const startRipple = document.createElement("paper-ripple");
            startIcon.icon = "mdi:play";
            startButton.appendChild(startIcon);
            startButton.appendChild(startRipple);
            startButton.addEventListener("click", (event) => {
                this._hass.callService("vacuum", "start", { entity_id: this.getVacuumEntityName(this._config.vacuum) }).then();
            });
            this.controlFlexBox.appendChild(startButton);
        }

        if (this._config.show_pause_button && this.shouldDisplayButton("pause", infoEntity.state)) {
            const pauseButton = document.createElement("paper-button");
            const pauseIcon = document.createElement("ha-icon");
            const pauseRipple = document.createElement("paper-ripple");
            pauseIcon.icon = "mdi:pause";
            pauseButton.appendChild(pauseIcon);
            pauseButton.appendChild(pauseRipple);
            pauseButton.addEventListener("click", (event) => {
                this._hass.callService("vacuum", "pause", { entity_id: this.getVacuumEntityName(this._config.vacuum) }).then();
            });
            this.controlFlexBox.appendChild(pauseButton);
        }

        if (this._config.show_stop_button && this.shouldDisplayButton("stop", infoEntity.state)) {
            const stopButton = document.createElement("paper-button");
            const stopIcon = document.createElement("ha-icon");
            const stopRipple = document.createElement("paper-ripple");
            stopIcon.icon = "mdi:stop";
            stopButton.appendChild(stopIcon);
            stopButton.appendChild(stopRipple);
            stopButton.addEventListener("click", (event) => {
                this._hass.callService("vacuum", "stop", { entity_id: this.getVacuumEntityName(this._config.vacuum) }).then();
            });
            this.controlFlexBox.appendChild(stopButton);
        }

        if (this._config.show_home_button && this.shouldDisplayButton("home", infoEntity.state)) {
            const homeButton = document.createElement("paper-button");
            const homeIcon = document.createElement("ha-icon");
            const homeRipple = document.createElement("paper-ripple");
            homeIcon.icon = "hass:home-map-marker";
            homeButton.appendChild(homeIcon);
            homeButton.appendChild(homeRipple);
            homeButton.addEventListener("click", (event) => {
                this._hass.callService("vacuum", "return_to_base", { entity_id: this.getVacuumEntityName(this._config.vacuum) }).then();
            });
            this.controlFlexBox.appendChild(homeButton);
        }

        if (this._config.show_locate_button) {
            const locateButton = document.createElement("paper-button");
            const locateIcon = document.createElement("ha-icon");
            const locateRipple = document.createElement("paper-ripple");
            locateIcon.icon = "hass:map-marker";
            locateButton.appendChild(locateIcon);
            locateButton.appendChild(locateRipple);
            locateButton.addEventListener("click", (event) => {
                this._hass.callService("vacuum", "locate", { entity_id: this.getVacuumEntityName(this._config.vacuum) }).then();
            });
            this.controlFlexBox.appendChild(locateButton);
        }

        this.customControlFlexBox = document.createElement("div");
        this.customControlFlexBox.classList.add("flex-box");


        this._config.custom_buttons.forEach(buttonConfig => {
            if (buttonConfig === Object(buttonConfig) && buttonConfig.service) {
                const customButton = document.createElement("paper-button");
                const customButtonIcon = document.createElement("ha-icon");
                const customButtonRipple = document.createElement("paper-ripple");

                customButtonIcon.icon = buttonConfig["icon"] || "mdi:radiobox-blank";
                customButton.appendChild(customButtonIcon);

                if (buttonConfig.text) {
                    const customButtonText = document.createElement("span");
                    customButtonText.textContent = buttonConfig.text;
                    customButton.appendChild(customButtonText);
                }

                customButton.appendChild(customButtonRipple);

                customButton.addEventListener("click", (event) => {
                    const args = buttonConfig["service"].split(".");
                    if (buttonConfig.service_data) {
                        this._hass.callService(args[0], args[1], buttonConfig.service_data).then();
                    } else {
                        this._hass.callService(args[0], args[1]).then();
                    }
                });

                this.customControlFlexBox.appendChild(customButton);
            }
        });

        // Replace existing controls
        this.clearContainer(this.controlContainer);
        this.controlContainer.append(this.infoBox);
        this.controlContainer.append(this.controlFlexBox);
        this.controlContainer.append(this.customControlFlexBox);

        // Done drawing controls
        this.lastUpdatedControls = infoEntity.last_updated;
        this.drawingControls = false;
    }

    // noinspection JSUnusedGlobalSymbols
    setConfig(config) {
        this._config = Object.assign(
            {},
            DEFAULT_CARD_CONFIG,
            config
        );

        if (typeof this._config.vacuum === "string") {
            this._config.vacuum = this._config.vacuum.toLowerCase();
        }


        /* More default stuff */

        // Rotation settings
        if (this._config.rotate === undefined) {
            this._config.rotate = 0;
        }
        if (Number(this._config.rotate)) {
            this._config.rotate = `${this._config.rotate}deg`;
        }

        // Crop settings
        if (this._config.crop !== Object(this._config.crop)) {
            this._config.crop = {};
        }
        if (this._config.crop.top === undefined) {
            this._config.crop.top = 0;
        }
        if (this._config.crop.bottom === undefined) {
            this._config.crop.bottom = 0;
        }
        if (this._config.crop.left === undefined) {
            this._config.crop.left = 0;
        }
        if (this._config.crop.right === undefined) {
            this._config.crop.right = 0;
        }

        /* End more default stuff */


        // Set card title and hide the header completely if the title is set to an empty value
        this.cardHeader.style.display = !this._config.title ? "none" : "block";
        this.cardTitle.textContent = this._config.title;

        // Set container card background color
        this.cardContainer.style.background = this._config.background_color ?? null;

        if (!Array.isArray(this._config.custom_buttons)) {
            this._config.custom_buttons = [];
        }
    }

    // noinspection JSUnusedGlobalSymbols
    set hass(hass) {
        if (hass === undefined) {
            // Home Assistant 0.110.0 may call this function with undefined sometimes if inside another card
            return;
        }

        this._hass = hass;

        let mapEntity = this.getMapEntity(this._config.vacuum);
        let vacuumEntity = this.getVacuumEntity(this._config.vacuum);
        let shouldForcePoll = false;

        let attributes = mapEntity ? mapEntity.attributes : undefined;

        if (vacuumEntity && vacuumEntity.state !== this.lastRobotState) {
            this.pollInterval = POLL_INTERVAL_STATE_MAP[vacuumEntity.state] || 10000;
            shouldForcePoll = true;
            this.lastRobotState = vacuumEntity.state;
        }

        if (mapEntity && mapEntity["state"] !== "unavailable" && attributes?.["entity_picture"]) {
            if (new Date().getTime() - this.pollInterval > this.lastMapPoll.getTime() || shouldForcePoll) {
                this.loadImageAndExtractMapData(attributes["entity_picture"]).then(mapData => {
                    if (mapData !== null) {
                        this.handleDrawing(hass, mapEntity, mapData);
                    }
                }).catch(e => {
                    this.handleDrawing(hass, mapEntity,{});

                    console.warn(e);
                }).finally(() => {
                    this.lastMapPoll = new Date();
                });
            }
        } else {
            this.clearContainer(this.mapContainer);
            this.clearContainer(this.controlContainer);

            this.entityWarning1.textContent = `Entity not available: ${this.getMapEntityName(this._config.vacuum)}`;
            this.entityWarning1.style.display = "block";
            this.entityWarning2.style.display = "none";
        }
    }

    async loadImageAndExtractMapData(url) {
        if (this.isPollingMap === false ) {
            this.isPollingMap = true;

            const response = await this._hass.fetchWithAuth(url);
            let mapData;

            if (!response.ok) {
                throw new Error("Got error while fetching image " + response.status + " - " + response.statusText);
            }
            const responseData = await response.arrayBuffer();

            const chunks = extractZtxtPngChunks(new Uint8Array(responseData)).filter(c => {
                return c.keyword === "ValetudoMap";
            });

            if (chunks.length < 1) {
                throw new Error("No map data found in image");
            }


            mapData = pako.inflate(chunks[0].data, { to: "string" });
            mapData = JSON.parse(mapData);

            mapData = preprocessMap(mapData);

            this.isPollingMap = false;
            return mapData;
        } else {
            return null;
        }
    }

    shouldDisplayButton(buttonName, vacuumState) {
        switch (vacuumState) {
            case "on":
            case "auto":
            case "spot":
            case "edge":
            case "single_room":
            case "cleaning": {
                return buttonName === "pause" || buttonName === "stop" || buttonName === "home";
            }

            case "returning": {
                return buttonName === "start" || buttonName === "pause";
            }

            case "docked": {
                return buttonName === "start";
            }

            case "idle":
            case "paused":
            default: {
                return buttonName === "start" || buttonName === "home";
            }
        }
    }


    handleDrawing(hass, mapEntity, attributes) {
        let infoEntity = this.getVacuumEntity(this._config.vacuum);

        let canDrawMap = false;
        let canDrawControls = true;

        if (attributes.__class === "ValetudoMap") {
            canDrawMap = true;
        }

        if (!infoEntity || infoEntity["state"] === "unavailable" || !infoEntity.attributes) {
            canDrawControls = false;
            // Reset last-updated to redraw as soon as element becomes available
            this.lastUpdatedControls = "";
        }

        // Remove the map
        this.mapContainer.style.display = (!canDrawMap || !this._config.show_map) ? "none" : "block";

        if (!canDrawMap && this._config.show_map) {
            // Show the warning
            this.entityWarning1.textContent = `Entity not available: ${this.getMapEntityName(this._config.vacuum)}`;
            this.entityWarning1.style.display = "block";
        } else {
            this.entityWarning1.style.display = "none";
        }

        if (!canDrawControls) {
            // Remove the controls
            this.controlContainer.style.display = "none";

            // Show the warning
            this.entityWarning2.textContent = `Entity not available: ${this.getVacuumEntityName(this._config.vacuum)}`;
            this.entityWarning2.style.display = "block";
        } else {
            this.entityWarning2.style.display = "none";
            this.controlContainer.style.display = "block";
        }

        if (canDrawMap) {
            // Calculate map height and width
            let width;
            let height;

            let boundingBox = {
                minX: attributes.size.x / attributes.pixelSize,
                minY: attributes.size.y / attributes.pixelSize,
                maxX: 0,
                maxY: 0
            };

            attributes.layers.forEach(l => {
                if (l.dimensions.x.min < boundingBox.minX) {
                    boundingBox.minX = l.dimensions.x.min;
                }
                if (l.dimensions.y.min < boundingBox.minY) {
                    boundingBox.minY = l.dimensions.y.min;
                }
                if (l.dimensions.x.max > boundingBox.maxX) {
                    boundingBox.maxX = l.dimensions.x.max;
                }
                if (l.dimensions.y.max > boundingBox.maxY) {
                    boundingBox.maxY = l.dimensions.y.max;
                }
            });

            width = (boundingBox.maxX - boundingBox.minX) + 2;
            height = (boundingBox.maxY - boundingBox.minY) + 2;

            const mapWidth = width - this._config.crop.right;
            const mapHeight = height - this._config.crop.bottom;

            // Calculate desired container height
            let containerHeight = (mapHeight * this._config.map_scale) - this._config.crop.top;
            let minHeight = this._config.min_height;

            // Want height based on container width
            if (String(this._config.min_height).endsWith("w")) {
                minHeight = this._config.min_height.slice(0, -1) * this.mapContainer.offsetWidth;
            }

            let containerMinHeightPadding = minHeight > containerHeight ? (minHeight - containerHeight) / 2 : 0;

            // Set container CSS
            this.mapContainerStyle.textContent = `
        #lovelaceValetudoMapCard {
          height: ${containerHeight}px;
          padding-top: ${containerMinHeightPadding}px;
          padding-bottom: ${containerMinHeightPadding}px;
          padding-left: ${this._config.left_padding}px;
          overflow: hidden;
        }
        #lovelaceValetudoCard {
          position: relative;
          margin-left: auto;
          margin-right: auto;
          width: ${mapWidth * this._config.map_scale}px;
          height: ${mapHeight * this._config.map_scale}px;
          transform: rotate(${this._config.rotate});
          top: -${this._config.crop.top}px;
          left: -${this._config.crop.left}px;
        }
        #lovelaceValetudoCard div {
          position: absolute;
          background-color: transparent;
          width: 100%;
          height: 100%;
        }
      `;

            if (this.shouldDrawMap() && this._config.show_map) {
                // Start drawing map
                this.drawingMap = true;

                this.drawMap(
                    attributes,
                    mapHeight,
                    mapWidth,
                    boundingBox
                );

                this.drawingMap = false;
            }
        }

        // Draw status and controls
        if (canDrawControls) {
            // Set control container CSS
            this.controlContainerStyle.textContent = `
        .flex-box {
          display: flex;
          justify-content: space-evenly;
          flex-wrap: wrap;
        }
        paper-button {
          cursor: pointer;
          position: relative;
          display: inline-flex;
          align-items: center;
          padding: 8px;
        }
        ha-icon {
          width: 24px;
          height: 24px;
        }
      `;

            let infoEntity = this.getVacuumEntity(this._config.vacuum);
            if (this.shouldDrawControls(infoEntity)) {
                this.drawControls(infoEntity);
            }
        }
    }

    // noinspection JSUnusedGlobalSymbols
    getCardSize() {
        return 1;
    }
}

let componentName = "valetudo-map-card";
if (!customElements.get(componentName)) {
    customElements.define(componentName, ValetudoMapCard);

    window.customCards = window.customCards || [];
    window.customCards.push({
        type: componentName,
        name: "Valetudo Map Card",
        preview: false,
        description: "Display the Map data of your Valetudo-enabled robot",
    });
}
