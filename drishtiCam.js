/**
 * BHOOMI-Net 2.0 - Drishti-Cam AI Computer Vision Engine
 * Simulates edge AI computer vision feed inspecting a disaster-prone landscape.
 * Overlays real-time segmentation polygons, object detection bounding boxes,
 * erosion vector tracking, and AR planting crosshairs.
 */

class DrishtiCamSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Telemetry State
    this.telemetry = {
      canopyCoverage: 24.2,
      bareSoil: 75.8,
      erosionDetected: true,
      slopeAngle: 26.4,
      fps: 30,
      lux: 6400,
      zoom: 1.0,
      status: 'ONLINE',
      resolution: '1600 × 1200'
    };

    // Layer Visibility
    this.layers = {
      canopy: true,
      bareSoil: true,
      erosion: true,
      hazard: true,
      arCrosshairs: true,
      scanlines: true,
      telemetryHud: true
    };

    // Animation & Scanline tracking
    this.scanY = 0;
    this.frameCounter = 0;
    this.waterOffset = 0;
    this.windAngle = 0;
    this.isRunning = false;

    // AI Detection Box Anchors (normalized coordinates 0..1)
    this.detections = [
      {
        id: 'DET-01',
        type: 'canopy',
        label: 'VEGETATION [CANOPY 24.2%]',
        sub: 'Native Deciduous / Moderate Health',
        points: [[0.05, 0.45], [0.28, 0.42], [0.35, 0.62], [0.18, 0.72], [0.03, 0.68]],
        color: '#00f098',
        box: [0.03, 0.40, 0.33, 0.33]
      },
      {
        id: 'DET-02',
        type: 'bareSoil',
        label: 'BARE SOIL [75.8% - HIGH RUNOFF]',
        sub: 'Exposed Topsoil / Low Infiltration',
        points: [[0.36, 0.38], [0.75, 0.35], [0.82, 0.68], [0.42, 0.74]],
        color: '#ffb300',
        box: [0.35, 0.33, 0.48, 0.42]
      },
      {
        id: 'DET-03',
        type: 'erosion',
        label: 'EROSION GULLY ACTIVE [V: 1.8 m/s]',
        sub: 'LiDAR Identified Slip Risk',
        points: [[0.48, 0.42], [0.54, 0.43], [0.58, 0.65], [0.50, 0.66]],
        color: '#ff9100',
        box: [0.47, 0.40, 0.12, 0.28]
      },
      {
        id: 'DET-04',
        type: 'hazard',
        label: 'CRITICAL SLOPE INSTABILITY [26.4°]',
        sub: 'Flash Flood + Landslide Threat',
        points: [[0.58, 0.44], [0.74, 0.42], [0.78, 0.62], [0.60, 0.65]],
        color: '#ff3366',
        box: [0.57, 0.41, 0.22, 0.25]
      }
    ];

    // AR Planting Crosshairs
    this.arPoints = [
      { x: 0.42, y: 0.52, id: 'PLANT-01', sp: 'Arjuna (3.5m)', zone: 'Riparian' },
      { x: 0.64, y: 0.48, id: 'PLANT-02', sp: 'Vetiver (Contour)', zone: 'Slope' },
      { x: 0.72, y: 0.56, id: 'PLANT-03', sp: 'Deep-Root Neem', zone: 'Slope' },
      { x: 0.52, y: 0.60, id: 'PLANT-04', sp: 'Bamboo Cluster', zone: 'Gully' }
    ];

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.start();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 800;
    this.canvas.height = 520;
  }

  start() {
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
  }

  setLayer(name, visible) {
    if (this.layers.hasOwnProperty(name)) {
      this.layers[name] = visible;
    }
  }

  updateTelemetry(newData) {
    Object.assign(this.telemetry, newData);
  }

  loop() {
    if (!this.isRunning) return;
    this.render();
    this.frameCounter++;
    requestAnimationFrame(() => this.loop());
  }

  render() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    // 1. Draw Simulated Background Environment (Mountain, Sky, Bare Slope, River)
    this.drawSimulatedLandscape(ctx, width, height);

    // 2. Draw AI Segmentation Polygons
    if (this.layers.canopy || this.layers.bareSoil || this.layers.erosion || this.layers.hazard) {
      this.drawAIDetections(ctx, width, height);
    }

    // 3. Draw AR Planting Crosshairs
    if (this.layers.arCrosshairs) {
      this.drawARCrosshairs(ctx, width, height);
    }

    // 4. Draw Camera Crosshairs & Reticle
    this.drawReticle(ctx, width, height);

    // 5. Draw Scanline Sweep Effect
    if (this.layers.scanlines) {
      this.drawScanlines(ctx, width, height);
    }

    // 6. Draw HUD Telemetry & Bounding Markers
    if (this.layers.telemetryHud) {
      this.drawHUD(ctx, width, height);
    }
  }

  drawSimulatedLandscape(ctx, w, h) {
    // Sky gradient (dusk / overcast environmental atmosphere)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
    skyGrad.addColorStop(0, '#0c172a');
    skyGrad.addColorStop(0.6, '#1e293b');
    skyGrad.addColorStop(1, '#334155');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.45);

    // Distant Mountain Ridges
    ctx.fillStyle = '#1e2d42';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.42);
    ctx.lineTo(w * 0.25, h * 0.26);
    ctx.lineTo(w * 0.55, h * 0.35);
    ctx.lineTo(w * 0.85, h * 0.22);
    ctx.lineTo(w, h * 0.38);
    ctx.lineTo(w, h * 0.5);
    ctx.lineTo(0, h * 0.5);
    ctx.closePath();
    ctx.fill();

    // Foreground Hillside (Bare Soil Slope with 26.4° grade)
    const hillGrad = ctx.createLinearGradient(0, h * 0.35, 0, h);
    hillGrad.addColorStop(0, '#544230'); // Dry brown topsoil
    hillGrad.addColorStop(0.5, '#3d2e20');
    hillGrad.addColorStop(1, '#271f17');
    ctx.fillStyle = hillGrad;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.46);
    ctx.bezierCurveTo(w * 0.3, h * 0.38, w * 0.6, h * 0.42, w, h * 0.34);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Bare Soil Eroded Terraces (Striae)
    ctx.strokeStyle = 'rgba(180, 140, 100, 0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const yOffset = h * 0.45 + i * 22;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, yOffset);
      ctx.bezierCurveTo(w * 0.45, yOffset - 8, w * 0.65, yOffset + 12, w * 0.85, yOffset - 4);
      ctx.stroke();
    }

    // Erosion Gully Channel (Carved ravine)
    ctx.fillStyle = 'rgba(30, 20, 15, 0.7)';
    ctx.beginPath();
    ctx.moveTo(w * 0.48, h * 0.42);
    ctx.quadraticCurveTo(w * 0.52, h * 0.55, w * 0.56, h * 0.75);
    ctx.lineTo(w * 0.60, h * 0.75);
    ctx.quadraticCurveTo(w * 0.55, h * 0.55, w * 0.52, h * 0.42);
    ctx.closePath();
    ctx.fill();

    // River / Waterfront Basin at the bottom-left
    this.waterOffset += 0.03;
    const waterGrad = ctx.createLinearGradient(0, h * 0.75, w * 0.4, h);
    waterGrad.addColorStop(0, '#0284c7');
    waterGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.74);
    ctx.bezierCurveTo(w * 0.15, h * 0.72 + Math.sin(this.waterOffset) * 2, w * 0.25, h * 0.78, w * 0.42, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Sparse Forest Canopy Trees on Left Ridge
    this.windAngle += 0.02;
    ctx.fillStyle = '#1b4332';
    const treePositions = [
      [w * 0.08, h * 0.48, 28],
      [w * 0.14, h * 0.46, 32],
      [w * 0.20, h * 0.50, 30],
      [w * 0.11, h * 0.55, 34],
      [w * 0.18, h * 0.58, 26]
    ];
    treePositions.forEach(([tx, ty, r]) => {
      ctx.beginPath();
      const sway = Math.sin(this.windAngle + tx) * 2;
      ctx.arc(tx + sway, ty, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawAIDetections(ctx, w, h) {
    this.detections.forEach(det => {
      // Check individual layer toggle
      if (det.type === 'canopy' && !this.layers.canopy) return;
      if (det.type === 'bareSoil' && !this.layers.bareSoil) return;
      if (det.type === 'erosion' && !this.layers.erosion) return;
      if (det.type === 'hazard' && !this.layers.hazard) return;

      const pts = det.points.map(([px, py]) => [px * w, py * h]);
      
      // Draw semi-transparent segmentation polygon
      ctx.fillStyle = det.color + '22'; // 14% alpha
      ctx.strokeStyle = det.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);

      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Corner bracket bounding box
      const bx = det.box[0] * w;
      const by = det.box[1] * h;
      const bw = det.box[2] * w;
      const bh = det.box[3] * h;
      this.drawCornerBrackets(ctx, bx, by, bw, bh, det.color);

      // AI Detection Badge Tag
      ctx.fillStyle = 'rgba(6, 12, 24, 0.88)';
      ctx.strokeStyle = det.color;
      ctx.lineWidth = 1;
      
      const tagW = ctx.measureText(det.label).width + 24;
      const tagH = 26;
      ctx.fillRect(bx, by - tagH, tagW, tagH);
      ctx.strokeRect(bx, by - tagH, tagW, tagH);

      // Dot Indicator
      ctx.fillStyle = det.color;
      ctx.beginPath();
      ctx.arc(bx + 8, by - tagH / 2, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Label text
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(det.label, bx + 18, by - tagH / 2 + 3.5);
    });
  }

  drawCornerBrackets(ctx, x, y, w, h, color, bracketLen = 14) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(x, y + bracketLen);
    ctx.lineTo(x, y);
    ctx.lineTo(x + bracketLen, y);
    // Top-right
    ctx.moveTo(x + w - bracketLen, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + bracketLen);
    // Bottom-left
    ctx.moveTo(x, y + h - bracketLen);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + bracketLen, y + h);
    // Bottom-right
    ctx.moveTo(x + w - bracketLen, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - bracketLen);
    ctx.stroke();
  }

  drawARCrosshairs(ctx, w, h) {
    const pulse = Math.sin(this.frameCounter * 0.08) * 3;

    this.arPoints.forEach(pt => {
      const cx = pt.x * w;
      const cy = pt.y * h;

      // Outer pulsing ring
      ctx.strokeStyle = 'rgba(0, 240, 152, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 14 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Inner crosshair
      ctx.strokeStyle = '#00f098';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy);
      ctx.lineTo(cx + 10, cy);
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx, cy + 10);
      ctx.stroke();

      // AR Tag
      ctx.fillStyle = 'rgba(6, 12, 24, 0.85)';
      ctx.strokeStyle = 'rgba(0, 240, 152, 0.6)';
      ctx.lineWidth = 1;
      ctx.fillRect(cx + 14, cy - 12, 115, 24);
      ctx.strokeRect(cx + 14, cy - 12, 115, 24);

      ctx.fillStyle = '#00f098';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`+ ${pt.id}`, cx + 18, cy);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText(pt.sp, cx + 18, cy + 9);
    });
  }

  drawReticle(ctx, w, h) {
    // Subtle screen center crosshair
    const cx = w / 2;
    const cy = h / 2;
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 25, cy);
    ctx.lineTo(cx - 8, cy);
    ctx.moveTo(cx + 8, cy);
    ctx.lineTo(cx + 25, cy);
    ctx.moveTo(cx, cy - 25);
    ctx.lineTo(cx, cy - 8);
    ctx.moveTo(cx, cy + 8);
    ctx.lineTo(cx, cy + 25);
    ctx.stroke();
  }

  drawScanlines(ctx, w, h) {
    // Horizontal scanline bar sweeping down
    this.scanY += 2.5;
    if (this.scanY > h) this.scanY = 0;

    const scanGrad = ctx.createLinearGradient(0, this.scanY - 30, 0, this.scanY);
    scanGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
    scanGrad.addColorStop(1, 'rgba(0, 229, 255, 0.09)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, this.scanY - 30, w, 30);

    // Subtle raster lines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1);
    }
  }

  drawHUD(ctx, w, h) {
    // Live Telemetry Watermark Top Bar
    ctx.fillStyle = 'rgba(0, 229, 255, 0.7)';
    ctx.font = '10px monospace';
    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);
    ctx.fillText(`CAM-01 [DRISHTI-EDGE] • LAT: 9.9252°N LON: 78.1198°E • ${timeStr} UTC`, 18, 24);

    // Grid Coordinates / Rule Marks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 6);
      ctx.moveTo(x, h - 6);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }
}

window.DrishtiCamSimulator = DrishtiCamSimulator;
