class ValetudoMapCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  };

  calculateColor(container, ...colors) {
    for (let color of colors) {
      if (!color) continue;
      if (color.startsWith('--')) {
        let possibleColor = getComputedStyle(container).getPropertyValue(color);
        if (!possibleColor) continue;
        return possibleColor;
      };
      return color;
    };
  };

  drawMap(container, mapData) {
    // Calculate colours
    const floorColor = this.calculateColor(container, this._config.floor_color, '--valetudo-map-floor-color', '--secondary-background-color');
    const obstacleWeakColor = this.calculateColor(container, this._config.obstacle_weak_color, '--valetudo-map-obstacle-weak-color', '--divider-color');
    const obstacleStrongColor = this.calculateColor(container, this._config.obstacle_strong_color, '--valetudo-map-obstacle-strong-color', '--accent-color');
    const pathColor = this.calculateColor(container, this._config.path_color, '--valetudo-map-path-color', '--primary-text-color');

    // Points to pixels
    const widthScale = 50 / this._config.map_scale;
    const heightScale = 50 / this._config.map_scale;
    const leftOffset = mapData.attributes.image.position.left * this._config.map_scale;
    const topOffset = mapData.attributes.image.position.top * this._config.map_scale;

    // Delete previous map
    while (container.firstChild) {
      container.firstChild.remove();
    };

    const containerContainer = document.createElement('div');
    const containerContainerStyle = document.createElement('style');
    containerContainerStyle.textContent = `
      div {
        position: relative;
        margin-left: auto;
        margin-right: auto;
        width: ${mapData.attributes.image.dimensions.width * this._config.map_scale}px;
        height: ${mapData.attributes.image.dimensions.height * this._config.map_scale}px;
      }
      div div {
        position: absolute;
        background-color: transparent;
        width: 100%;
        height: 100%;
        transform: rotate(${this._config.rotate});
      }
    `
    container.appendChild(containerContainer);
    container.appendChild(containerContainerStyle);

    const mapContainer = document.createElement('div');
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = mapData.attributes.image.dimensions.width * this._config.map_scale;
    mapCanvas.height = mapData.attributes.image.dimensions.height * this._config.map_scale;
    mapContainer.style.zIndex = 1;
    mapContainer.appendChild(mapCanvas);

    const chargerContainer = document.createElement('div');
    const chargerHTML = document.createElement('ha-icon');
    if (this._config.show_dock) {
      chargerHTML.icon = this._config.dock_icon || 'mdi:flash';
      chargerHTML.style.left = `${Math.floor(mapData.attributes.charger[0] / widthScale) - leftOffset - (12 * this._config.icon_scale)}px`;
      chargerHTML.style.top = `${Math.floor(mapData.attributes.charger[1] / heightScale) - topOffset - (12 * this._config.icon_scale)}px`;
      chargerHTML.style.color = 'green';
      chargerHTML.style.transform = `scale(${this._config.icon_scale}, ${this._config.icon_scale})`;
    };
    chargerContainer.style.zIndex = 2;
    chargerContainer.appendChild(chargerHTML);

    const pathContainer = document.createElement('div');
    const pathCanvas = document.createElement('canvas');
    pathCanvas.width = mapData.attributes.image.dimensions.width * this._config.map_scale;
    pathCanvas.height = mapData.attributes.image.dimensions.height * this._config.map_scale;
    pathContainer.style.zIndex = 3;
    pathContainer.appendChild(pathCanvas);

    const vacuumContainer = document.createElement('div');
    const vacuumHTML = document.createElement('ha-icon');
    if (this._config.show_vacuum) {
      vacuumHTML.icon = this._config.vacuum_icon || 'mdi:robot-vacuum';
      vacuumHTML.style.left = `${Math.floor(mapData.attributes.robot[0] / widthScale) - leftOffset - (12 * this._config.icon_scale)}px`;
      vacuumHTML.style.top = `${Math.floor(mapData.attributes.robot[1] / heightScale) - topOffset - (12 * this._config.icon_scale)}px`;
      vacuumHTML.style.transform = `scale(${this._config.icon_scale}, ${this._config.icon_scale})`;
    }
    vacuumContainer.style.zIndex = 4;
    vacuumContainer.appendChild(vacuumHTML);

    containerContainer.appendChild(mapContainer);
    containerContainer.appendChild(chargerContainer);
    containerContainer.appendChild(pathContainer);
    containerContainer.appendChild(vacuumContainer);

    const mapCtx = mapCanvas.getContext("2d");
    mapCtx.fillStyle = floorColor;
    for (let item of mapData.attributes.image.pixels.floor) {
      let x = item[0] * this._config.map_scale;
      if (x < this._config.crop.left || x > (mapCanvas.width - this._config.crop.right)) continue;
      let y = item[1] * this._config.map_scale;
      if (y < this._config.crop.top || y > (mapCanvas.height - this._config.crop.bottom)) continue;
      mapCtx.fillRect(x, y, this._config.map_scale, this._config.map_scale);
    };

    mapCtx.fillStyle = obstacleWeakColor;
    for (let item of mapData.attributes.image.pixels.obstacle_weak) {
      let x = item[0] * this._config.map_scale;
      if (x < this._config.crop.left || x > (mapCanvas.width - this._config.crop.right)) continue;
      let y = item[1] * this._config.map_scale;
      if (y < this._config.crop.top || y > (mapCanvas.height - this._config.crop.bottom)) continue;
      mapCtx.fillRect(x, y, this._config.map_scale, this._config.map_scale);
    };

    mapCtx.fillStyle = obstacleStrongColor;
    for (let item of mapData.attributes.image.pixels.obstacle_strong) {
      let x = item[0] * this._config.map_scale;
      if (x < this._config.crop.left || x > (mapCanvas.width - this._config.crop.right)) continue;
      let y = item[1] * this._config.map_scale;
      if (y < this._config.crop.top || y > (mapCanvas.height - this._config.crop.bottom)) continue;
      mapCtx.fillRect(x, y, this._config.map_scale, this._config.map_scale);
    };

    if (mapData.attributes.path.points) {
      const pathCtx = pathCanvas.getContext("2d");
      pathCtx.strokeStyle = pathColor;

      let first = true;
      let prevX = 0;
      let prevY = 0;
      let x = 0;
      let y = 0;
      pathCtx.beginPath();
      for (let i = 0; i < mapData.attributes.path.points.length; i++) {
        let item = mapData.attributes.path.points[i];
        if (!first) {
          prevX = x;
          prevY = y;
        };
        x = Math.floor((item[0]) / widthScale) - leftOffset;
        y = Math.floor((item[1]) / heightScale) - topOffset;
        if (first) {
          pathCtx.moveTo(x, y);
          first = false;
        } else {
          pathCtx.lineTo(x, y);
        };

      };

      if (this._config.show_path) pathCtx.stroke();

      // Update vacuum angle
      if (!first) {
        vacuumHTML.style.transform = `scale(${this._config.icon_scale}, ${this._config.icon_scale}) rotate(${(Math.atan2(y - prevY, x - prevX) * 180 / Math.PI) + 90}deg)`;
      };
    };
  };

  setConfig(config) {
    let cardContainer = document.createElement('ha-card');

    if (config.show_dock === undefined) config.show_dock = true;
    if (config.show_vacuum === undefined) config.show_vacuum = true;
    if (config.show_path === undefined) config.show_path = true;
    if (config.map_scale === undefined) config.map_scale = 1;
    if (config.icon_scale === undefined) config.icon_scale = 1;
    if (config.rotate === undefined) config.rotate = 0;
    if (Number(config.rotate)) config.rotate = `${config.rotate}deg`;
    if (config.crop !== Object(config.crop)) config.crop = {};
    if (config.crop.top === undefined) config.crop.top = 0;
    if (config.crop.bottom === undefined) config.crop.bottom = 0;
    if (config.crop.left === undefined) config.crop.left = 0;
    if (config.crop.right === undefined) config.crop.right = 0;

    while (this.shadowRoot.firstChild) {
      this.shadowRoot.firstChild.remove();
    };

    this.shadowRoot.appendChild(cardContainer);

    this._config = config;
  };

  set hass(hass) {
    this._hass = hass;
    const config = this._config;
    let mapEntity = this._hass.states[this._config.entity];
    if (!mapEntity) {
      let warning = document.createElement('hui-warning');
      warning.textContent = `Entity not available: ${this._config.entity}`;
      while (this.shadowRoot.firstChild) {
        this.shadowRoot.firstChild.remove();
      };
      this.shadowRoot.appendChild(warning);
      return;
    }
    this.drawMap(this.shadowRoot.firstChild, mapEntity);
  };

  getCardSize() {
    return 1;
  };
}

customElements.define('valetudo-map-card', ValetudoMapCard);
