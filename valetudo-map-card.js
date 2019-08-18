class ValetudoMapCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  };

  drawMap(container, mapData) {
    // Delete previous map
    while (container.firstChild) {
      container.firstChild.remove();
    };

    const canvas = document.createElement('canvas');
    canvas.width = mapData.attributes.image.dimensions.width;
    canvas.height = mapData.attributes.image.dimensions.height;

    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = this._config.floor_color;
    for (let item of mapData.attributes.image.pixels.floor) {
      ctx.fillRect(item[0], item[1], 1, 1);
    };

    ctx.fillStyle = this._config.obstacle_weak_color;
    for (let item of mapData.attributes.image.pixels.obstacle_weak) {
      ctx.fillRect(item[0], item[1], 1, 1);
    };

    ctx.fillStyle = this._config.obstacle_strong_color;
    for (let item of mapData.attributes.image.pixels.obstacle_strong) {
      ctx.fillRect(item[0], item[1], 1, 1);
    };

    // TODO: Charger and vacuum

    ctx.fillStyle = this._config.path_color;
    for (let item of mapData.attributes.path.points) {
      ctx.fillRect(item[0], item[1], 1, 1);
    };
  };

  setConfig(config) {
    config.floor_color = config.floor_color || 'black';
    config.obstacle_weak_color = config.obstacle_weak_color || 'orange';
    config.obstacle_strong_color = config.obstacle_strong_color || 'red';
    config.path_color = config.path_color || 'white';

    let cardContainer = document.createElement('ha-card');

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
    if (!mapEntity) return;
    this.drawMap(this.shadowRoot.firstChild, mapEntity);
  };

  getCardSize() {
    return 1;
  };
}

customElements.define('valetudo-map-card', ValetudoMapCard);
