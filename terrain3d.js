/**
 * BHOOMI-Net 2.0 - 3D Digital Twin Terrain Engine (Three.js)
 * Implements interactive procedural 3D landscape with:
 * - Mountain ridges, steep hillside (26.4°), and river valley
 * - Animated flowing river and dynamic flood inundation plane
 * - Wildfire heat zone particle spread
 * - Layer toggles: Vegetation, Water, Slope Heatmap, Fire, Flood, Planting Pins
 * - Dynamic Before vs After Afforestation tree growth & terrain morphing
 * - OrbitControls & cinematic camera presets
 */

class Terrain3DDigitalTwin {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.terrainMesh = null;
    this.waterMesh = null;
    this.floodMesh = null;
    this.fireMesh = null;
    this.treesGroup = null;
    this.newTreesGroup = null;
    this.pinsGroup = null;

    // Simulation & Morphing State
    this.afforestationProgress = 0.0; // 0.0 = Before (24% canopy), 1.0 = After (68% canopy)
    this.hazardState = {
      active: null,
      stage: 1,
      floodIntensity: 0.0,
      fireIntensity: 0.0
    };

    // Layer Visibilities
    this.layerToggles = {
      vegetation: true,
      water: true,
      slopeHeatmap: false,
      fireRisk: false,
      floodRisk: false,
      plantingLocations: true
    };

    this.clock = null;
    this.init();
  }

  init() {
    if (typeof THREE === 'undefined') {
      console.warn("Three.js not loaded yet. Waiting...");
      setTimeout(() => this.init(), 200);
      return;
    }

    this.clock = new THREE.Clock();

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060b14);
    this.scene.fog = new THREE.FogExp2(0x060b14, 0.0055);

    // 2. Camera setup
    const w = this.canvas.parentElement.clientWidth || 800;
    const h = this.canvas.parentElement.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(45, w / h, 1, 2000);
    this.camera.position.set(0, 140, 210);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent dipping below ground
      this.controls.minDistance = 30;
      this.controls.maxDistance = 500;
      this.controls.target.set(0, 15, 0);
    }

    // 5. Lighting
    this.setupLighting();

    // 6. Build Terrain Geometry & Shading
    this.buildTerrain();

    // 7. Build River & Dynamic Flood Plane
    this.buildHydrology();

    // 8. Build Existing Forest Trees
    this.buildExistingVegetation();

    // 9. Build Afforestation Saplings (Morphing with slider)
    this.buildAfforestationTrees();

    // 10. Build 3D Planting Pins
    this.buildPlantingPins();

    // 11. Handle Resizing
    window.addEventListener('resize', () => this.onResize());

    // 12. Animation loop
    this.animate();
  }

  setupLighting() {
    // Ambient Light (deep cool blue)
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.4);
    this.scene.add(ambientLight);

    // Sun / Key Light
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.6);
    sunLight.position.set(120, 200, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 600;
    const d = 160;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    this.scene.add(sunLight);

    // Cyan Fill Light (futuristic environmental glow)
    const fillLight = new THREE.DirectionalLight(0x00e5ff, 0.4);
    fillLight.position.set(-100, 80, -100);
    this.scene.add(fillLight);
  }

  buildTerrain() {
    // 200x200 Plane with 128x128 vertices
    const size = 260;
    const segments = 120;
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    const colors = [];

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Procedural elevation calculation:
      // High mountain ridge in North (Z < -40)
      // Steep slope (26.4°) in Center (-40 < Z < 40)
      // River valley in South (Z > 40)
      let y = 0;

      // Mountain ridge component
      y += Math.max(0, -z * 0.45) * 1.4;
      y += Math.sin(x * 0.03) * Math.cos(z * 0.03) * 16;
      y += Math.sin(x * 0.08 + z * 0.04) * 5;

      // River gorge depression (carves through southern valley)
      const riverDist = Math.abs(z - 55 - Math.sin(x * 0.04) * 22);
      if (riverDist < 30) {
        y -= (30 - riverDist) * 0.65;
      }

      // Erosion Gully depression (fissure running down central slope)
      const gullyDist = Math.abs(x - 15 - Math.sin(z * 0.06) * 10);
      if (gullyDist < 12 && z > -20 && z < 50) {
        y -= (12 - gullyDist) * 0.4;
      }

      pos.setY(i, y);

      // Vertex color setup (Initial baseline: Bare soil brown + rock grey)
      const c = new THREE.Color();
      if (y > 45) {
        c.setHex(0x334155); // Rocky ridge slate
      } else if (riverDist < 25) {
        c.setHex(0x2d3748); // Riverbank gravel
      } else if (x < -30 && z > -30 && z < 30) {
        c.setHex(0x1b4332); // Existing sparse forest green
      } else {
        c.setHex(0x544230); // Bare eroded soil brown
      }
      colors.push(c.r, c.g, c.b);
    }

    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    this.terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true
    });

    this.terrainMesh = new THREE.Mesh(geom, this.terrainMaterial);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = true;
    this.scene.add(this.terrainMesh);

    // Store original colors for morphing
    this.originalColors = colors.slice();
  }

  buildHydrology() {
    // Normal Flowing River
    const riverGeom = new THREE.PlaneGeometry(260, 36, 40, 10);
    riverGeom.rotateX(-Math.PI / 2);
    
    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });

    this.waterMesh = new THREE.Mesh(riverGeom, this.waterMaterial);
    this.waterMesh.position.set(0, 3.2, 55);
    this.scene.add(this.waterMesh);

    // Flood Inundation Surge Plane
    const floodGeom = new THREE.PlaneGeometry(260, 140);
    floodGeom.rotateX(-Math.PI / 2);

    this.floodMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.5,
      transparent: true,
      opacity: 0.0 // Initially invisible
    });

    this.floodMesh = new THREE.Mesh(floodGeom, this.floodMaterial);
    this.floodMesh.position.set(0, 3.0, 40);
    this.scene.add(this.floodMesh);

    // Wildfire Risk Heat Plane (Glowing orange mesh along northern ridge)
    const fireGeom = new THREE.PlaneGeometry(220, 80);
    fireGeom.rotateX(-Math.PI / 2);

    this.fireMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.0,
      wireframe: true
    });

    this.fireMesh = new THREE.Mesh(fireGeom, this.fireMaterial);
    this.fireMesh.position.set(0, 48, -60);
    this.scene.add(this.fireMesh);
  }

  buildExistingVegetation() {
    this.treesGroup = new THREE.Group();
    
    // Geometry templates
    const trunkGeom = new THREE.CylinderGeometry(0.3, 0.5, 3, 5);
    const foliageGeom = new THREE.ConeGeometry(2.2, 5.5, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.8, flatShading: true });

    // Place ~45 mature trees on western flank (24.2% baseline canopy)
    for (let i = 0; i < 45; i++) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = 1.5;
      trunk.castShadow = true;
      tree.add(trunk);

      const foliage = new THREE.Mesh(foliageGeom, foliageMat);
      foliage.position.y = 4.5;
      foliage.castShadow = true;
      tree.add(foliage);

      // Position in left quadrant
      const tx = -50 - Math.random() * 45;
      const tz = -30 + Math.random() * 65;
      const ty = this.getTerrainHeightAt(tx, tz);

      tree.position.set(tx, ty, tz);
      const s = 0.8 + Math.random() * 0.5;
      tree.scale.set(s, s, s);
      this.treesGroup.add(tree);
    }

    this.scene.add(this.treesGroup);
  }

  buildAfforestationTrees() {
    this.newTreesGroup = new THREE.Group();

    const trunkGeom = new THREE.CylinderGeometry(0.2, 0.35, 2.5, 5);
    const foliageGeom = new THREE.ConeGeometry(1.8, 4.5, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.9 });
    
    // Distinct species foliage materials
    const arjunaMat = new THREE.MeshStandardMaterial({ color: 0x00f098, roughness: 0.7, flatShading: true });
    const neemMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.7, flatShading: true });
    const mahuaMat = new THREE.MeshStandardMaterial({ color: 0x66bb6a, roughness: 0.7, flatShading: true });

    // Place 110 afforestation saplings across bare hillside & riparian corridor
    for (let i = 0; i < 110; i++) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = 1.25;
      trunk.castShadow = true;
      tree.add(trunk);

      // Choose material based on zone
      let fMat = neemMat;
      const tx = -35 + Math.random() * 110;
      const tz = -65 + Math.random() * 115;

      if (tz > 35) fMat = arjunaMat; // Waterfront
      else if (tz < -25) fMat = mahuaMat; // Ridge

      const foliage = new THREE.Mesh(foliageGeom, fMat);
      foliage.position.y = 3.5;
      foliage.castShadow = true;
      tree.add(foliage);

      const ty = this.getTerrainHeightAt(tx, tz);
      tree.position.set(tx, ty, tz);

      // Store initial scale as 0 (hidden until slider moves)
      tree.userData = { targetScale: 0.7 + Math.random() * 0.5 };
      tree.scale.set(0.001, 0.001, 0.001);

      this.newTreesGroup.add(tree);
    }

    this.scene.add(this.newTreesGroup);
  }

  buildPlantingPins() {
    this.pinsGroup = new THREE.Group();

    // Pin geometries
    const pinGeom = new THREE.ConeGeometry(0.8, 3.2, 6);
    pinGeom.rotateX(Math.PI); // Point down
    
    const greenMat = new THREE.MeshBasicMaterial({ color: 0x00f098 });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffb300 });

    // Use afforestation engine points if available
    const points = window.bhoomiAfforest ? window.bhoomiAfforest.plantingPoints : [];

    points.forEach(pt => {
      if (pt.suitability === 'unsuitable') return; // Do not place pin in exclusion zone

      const mat = pt.suitability === 'suitable' ? greenMat : yellowMat;
      const pin = new THREE.Mesh(pinGeom, mat);

      // Map lat/lng offset to terrain 3D coords
      const tx = (pt.lng - 78.1215) * 14000;
      const tz = -(pt.lat - 9.9265) * 14000;
      const ty = this.getTerrainHeightAt(tx, tz) + 3.0;

      pin.position.set(tx, ty, tz);
      this.pinsGroup.add(pin);
    });

    this.scene.add(this.pinsGroup);
  }

  getTerrainHeightAt(x, z) {
    let y = 0;
    y += Math.max(0, -z * 0.45) * 1.4;
    y += Math.sin(x * 0.03) * Math.cos(z * 0.03) * 16;
    y += Math.sin(x * 0.08 + z * 0.04) * 5;

    const riverDist = Math.abs(z - 55 - Math.sin(x * 0.04) * 22);
    if (riverDist < 30) y -= (30 - riverDist) * 0.65;

    const gullyDist = Math.abs(x - 15 - Math.sin(z * 0.06) * 10);
    if (gullyDist < 12 && z > -20 && z < 50) y -= (12 - gullyDist) * 0.4;

    return y;
  }

  /**
   * Sets Before vs After Afforestation Progress (0.0 to 1.0)
   * Dynamically grows trees and greens the terrain vertices
   */
  setAfforestationProgress(val) {
    this.afforestationProgress = Math.max(0, Math.min(1, val));

    // 1. Scale new afforestation trees
    if (this.newTreesGroup) {
      this.newTreesGroup.children.forEach(tree => {
        const targetS = tree.userData.targetScale || 1.0;
        const currentS = Math.max(0.001, this.afforestationProgress * targetS);
        tree.scale.set(currentS, currentS, currentS);
      });
    }

    // 2. Morph terrain vertex colors towards lush green
    if (this.terrainMesh && this.originalColors) {
      const colorAttr = this.terrainMesh.geometry.attributes.color;
      const pos = this.terrainMesh.geometry.attributes.position;
      const count = colorAttr.count;

      for (let i = 0; i < count; i++) {
        const origR = this.originalColors[i * 3];
        const origG = this.originalColors[i * 3 + 1];
        const origB = this.originalColors[i * 3 + 2];
        const y = pos.getY(i);

        // If it was brown bare soil and not high rock
        if (origR > 0.25 && origG < 0.35 && y < 40) {
          // Morph to lush forest green (#1b4332 -> r: 0.11, g: 0.26, b: 0.19)
          const targetR = 0.11;
          const targetG = 0.28;
          const targetB = 0.18;

          colorAttr.setXYZ(
            i,
            origR + (targetR - origR) * this.afforestationProgress,
            origG + (targetG - origG) * this.afforestationProgress,
            origB + (targetB - origB) * this.afforestationProgress
          );
        }
      }
      colorAttr.needsUpdate = true;
    }
  }

  /**
   * Updates Hazard Simulation Effects in 3D
   */
  updateHazardVisuals(hazard, stage) {
    this.hazardState.active = hazard;
    this.hazardState.stage = stage;

    // Flash Flood
    if (hazard === 'flood') {
      const surgeRatio = (stage - 1) / 7.0; // 0..1
      if (this.floodMesh) {
        this.floodMesh.position.y = 3.2 + surgeRatio * 4.5;
        this.floodMaterial.opacity = 0.2 + surgeRatio * 0.65;
        this.floodMesh.visible = this.layerToggles.floodRisk || stage >= 2;
      }
      if (this.fireMesh) this.fireMaterial.opacity = 0.0;
    }
    // Wildfire
    else if (hazard === 'fire') {
      const fireRatio = (stage - 1) / 7.0;
      if (this.fireMesh) {
        this.fireMaterial.opacity = 0.15 + fireRatio * 0.7;
        this.fireMesh.visible = this.layerToggles.fireRisk || stage >= 3;
      }
      if (this.floodMesh) this.floodMaterial.opacity = 0.0;
    }
    // Baseline or Landslide
    else {
      if (this.floodMesh) this.floodMaterial.opacity = 0.0;
      if (this.fireMesh) this.fireMaterial.opacity = 0.0;
    }
  }

  /**
   * Layer Toggle Handler
   */
  setLayer(layerName, visible) {
    if (this.layerToggles.hasOwnProperty(layerName)) {
      this.layerToggles[layerName] = visible;

      if (layerName === 'vegetation') {
        if (this.treesGroup) this.treesGroup.visible = visible;
        if (this.newTreesGroup) this.newTreesGroup.visible = visible;
      } else if (layerName === 'water') {
        if (this.waterMesh) this.waterMesh.visible = visible;
      } else if (layerName === 'plantingLocations') {
        if (this.pinsGroup) this.pinsGroup.visible = visible;
      } else if (layerName === 'floodRisk') {
        if (this.floodMesh) this.floodMesh.visible = visible;
      } else if (layerName === 'fireRisk') {
        if (this.fireMesh) this.fireMesh.visible = visible;
      } else if (layerName === 'slopeHeatmap') {
        this.applySlopeHeatmap(visible);
      }
    }
  }

  applySlopeHeatmap(enable) {
    if (!this.terrainMesh || !this.originalColors) return;
    const colorAttr = this.terrainMesh.geometry.attributes.color;
    const pos = this.terrainMesh.geometry.attributes.position;
    const norm = this.terrainMesh.geometry.attributes.normal;

    for (let i = 0; i < colorAttr.count; i++) {
      if (enable) {
        // Compute slope angle from surface normal Y
        const ny = norm.getY(i);
        const slopeDeg = Math.acos(Math.max(0, Math.min(1, ny))) * (180 / Math.PI);
        
        if (slopeDeg > 28) {
          colorAttr.setXYZ(i, 0.95, 0.1, 0.25); // Red (Critical Steep > 28°)
        } else if (slopeDeg > 18) {
          colorAttr.setXYZ(i, 0.95, 0.7, 0.0); // Amber (Moderate 18°-28°)
        } else {
          colorAttr.setXYZ(i, 0.1, 0.8, 0.4); // Green (Gentle < 18°)
        }
      } else {
        // Restore original
        colorAttr.setXYZ(
          i,
          this.originalColors[i * 3],
          this.originalColors[i * 3 + 1],
          this.originalColors[i * 3 + 2]
        );
      }
    }
    colorAttr.needsUpdate = true;
  }

  /**
   * Camera Angle Presets
   */
  setCameraPreset(presetName) {
    if (!this.camera || !this.controls) return;

    if (presetName === 'birdseye') {
      this.camera.position.set(0, 240, 10);
      this.controls.target.set(0, 10, 0);
    } else if (presetName === 'drone') {
      this.camera.position.set(80, 110, 140);
      this.controls.target.set(-10, 15, -10);
    } else if (presetName === 'riverbed') {
      this.camera.position.set(-60, 22, 95);
      this.controls.target.set(20, 10, 45);
    } else if (presetName === 'slope') {
      this.camera.position.set(30, 45, -10);
      this.controls.target.set(-10, 22, 20);
    }
    this.controls.update();
  }

  onResize() {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const w = this.canvas.parentElement.clientWidth || 800;
    const h = this.canvas.parentElement.clientHeight || 600;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock ? this.clock.getDelta() : 0.016;
    const time = this.clock ? this.clock.getElapsedTime() : 0;

    // Subtle water surface motion
    if (this.waterMesh) {
      this.waterMesh.position.y = 3.2 + Math.sin(time * 1.5) * 0.15;
    }

    // Fire mesh subtle pulse
    if (this.fireMesh && this.fireMaterial.opacity > 0) {
      this.fireMesh.rotation.y = Math.sin(time * 2) * 0.02;
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

window.Terrain3DDigitalTwin = Terrain3DDigitalTwin;
