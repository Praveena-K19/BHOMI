/**
 * BHOOMI-Net 2.0 - GPS Planting Optimizer & 2D Map Engine (Leaflet.js)
 * Visualizes 65+ AI-generated GPS planting crosshairs across 3 ecological zones.
 * Enforces tree placement rules (🟢 Suitable, 🟡 Moderate, 🔴 Unsuitable).
 * Provides interactive marker inspection and zone filtering.
 */

class GPSPlantingMap {
  constructor(mapContainerId) {
    this.containerId = mapContainerId;
    this.map = null;
    this.markersGroup = null;
    this.zonesGroup = null;
    this.currentFilter = 'all';
    this.selectedPlant = null;
    this.points = [];

    this.init();
  }

  init() {
    if (typeof L === 'undefined') {
      console.warn("Leaflet not loaded yet. Retrying...");
      setTimeout(() => this.init(), 250);
      return;
    }

    const container = document.getElementById(this.containerId);
    if (!container) return;

    const center = [9.9265, 78.1215];

    // Initialize Leaflet map with dark theme CartoDB basemap
    this.map = L.map(this.containerId, {
      center: center,
      zoom: 16,
      zoomControl: true,
      attributionControl: false
    });

    // Dark tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);
    this.zonesGroup = L.layerGroup().addTo(this.map);

    // Get points from AfforestationEngine
    if (window.bhoomiAfforest) {
      this.points = window.bhoomiAfforest.plantingPoints;
    }

    // Draw ecological zone boundary polygons
    this.drawZoneBoundaries();

    // Render markers
    this.renderMarkers();

    // Setup Inspector panel with default first point
    if (this.points.length > 0) {
      this.selectPlant(this.points[0]);
    }
  }

  drawZoneBoundaries() {
    // 1. Waterfront Riparian Zone Polygon (Cyan)
    const waterfrontCoords = [
      [9.9220, 78.1180],
      [9.9220, 78.1245],
      [9.9242, 78.1250],
      [9.9238, 78.1175]
    ];
    L.polygon(waterfrontCoords, {
      color: '#00e5ff',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#00e5ff',
      fillOpacity: 0.12
    }).bindTooltip("Zone 1: Waterfront (Riparian Buffer)", { sticky: true }).addTo(this.zonesGroup);

    // 2. Hillside Slope Zone Polygon (Green)
    const hillsideCoords = [
      [9.9242, 78.1175],
      [9.9242, 78.1250],
      [9.9275, 78.1255],
      [9.9272, 78.1170]
    ];
    L.polygon(hillsideCoords, {
      color: '#00f098',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#00f098',
      fillOpacity: 0.12
    }).bindTooltip("Zone 2: Hillside (Slope Stabilization 26.4°)", { sticky: true }).addTo(this.zonesGroup);

    // 3. Ridge / Forest Fringe Polygon (Amber)
    const ridgeCoords = [
      [9.9272, 78.1170],
      [9.9275, 78.1255],
      [9.9305, 78.1250],
      [9.9300, 78.1165]
    ];
    L.polygon(ridgeCoords, {
      color: '#ffb300',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#ffb300',
      fillOpacity: 0.12
    }).bindTooltip("Zone 3: Ridge / Forest Fringe (Firebreak)", { sticky: true }).addTo(this.zonesGroup);
  }

  createCrosshairIcon(suitability) {
    let color = '#00f098'; // Suitable
    let symbol = '+';

    if (suitability === 'moderate') {
      color = '#ffb300';
      symbol = '⨁';
    } else if (suitability === 'unsuitable') {
      color = '#ff3366';
      symbol = '✕';
    }

    const html = `
      <div style="
        width: 22px;
        height: 22px;
        background: rgba(8, 14, 26, 0.85);
        border: 1.5px solid ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${color};
        font-weight: 900;
        font-size: 13px;
        font-family: monospace;
        box-shadow: 0 0 8px ${color}66;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        ${symbol}
      </div>
    `;

    return L.divIcon({
      html: html,
      className: 'custom-gps-crosshair',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
  }

  renderMarkers() {
    this.markersGroup.clearLayers();

    this.points.forEach(pt => {
      // Filter logic
      if (this.currentFilter === 'suitable' && pt.suitability !== 'suitable') return;
      if (this.currentFilter === 'moderate' && pt.suitability !== 'moderate') return;
      if (this.currentFilter === 'unsuitable' && pt.suitability !== 'unsuitable') return;
      if (this.currentFilter === 'waterfront' && pt.zoneKey !== 'waterfront') return;
      if (this.currentFilter === 'hillside' && pt.zoneKey !== 'hillside') return;
      if (this.currentFilter === 'ridge' && pt.zoneKey !== 'ridge') return;

      const icon = this.createCrosshairIcon(pt.suitability);
      const marker = L.marker([pt.lat, pt.lng], { icon: icon });

      // Click to inspect
      marker.on('click', () => {
        this.selectPlant(pt);
      });

      // Hover tooltip
      marker.bindTooltip(`<b>${pt.id}</b> • ${pt.species}`, {
        className: 'gps-marker-tooltip',
        direction: 'top'
      });

      this.markersGroup.addLayer(marker);
    });
  }

  selectPlant(plant) {
    this.selectedPlant = plant;

    // Update UI Inspector Card Elements
    const idEl = document.getElementById('inspector-plant-id');
    const latEl = document.getElementById('inspector-lat');
    const lngEl = document.getElementById('inspector-lng');
    const zoneEl = document.getElementById('inspector-zone');
    const speciesEl = document.getElementById('inspector-species');
    const spacingEl = document.getElementById('inspector-spacing');
    const priorityEl = document.getElementById('inspector-priority');
    const reasonEl = document.getElementById('inspector-reason');
    const suitBadge = document.getElementById('inspector-suit-badge');

    if (idEl) idEl.textContent = plant.id;
    if (latEl) latEl.textContent = `${plant.lat.toFixed(6)}° N`;
    if (lngEl) lngEl.textContent = `${plant.lng.toFixed(6)}° E`;
    if (zoneEl) zoneEl.textContent = plant.zoneName;
    if (speciesEl) speciesEl.textContent = plant.species;
    if (spacingEl) spacingEl.textContent = plant.spacing;
    if (priorityEl) priorityEl.textContent = plant.priority;
    if (reasonEl) reasonEl.textContent = plant.reason;

    if (suitBadge) {
      suitBadge.textContent = plant.suitability.toUpperCase();
      suitBadge.className = 'metric-badge';
      if (plant.suitability === 'suitable') suitBadge.classList.add('badge-low'); // green
      else if (plant.suitability === 'moderate') suitBadge.classList.add('badge-med'); // yellow
      else suitBadge.classList.add('badge-high'); // red
    }
  }

  setFilter(filterName) {
    this.currentFilter = filterName;
    this.renderMarkers();
  }

  invalidateSize() {
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 150);
    }
  }
}

window.GPSPlantingMap = GPSPlantingMap;
