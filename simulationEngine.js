/**
 * BHOOMI-Net 2.0 - Multi-Hazard Simulation Engine
 * Manages 8-stage step-by-step disaster progressions:
 * 1. Flash Flood
 * 2. Wildfire
 * 3. Landslide
 * 4. Stable Baseline
 *
 * Implements Multi-Sensor Fusion formulas, risk scoring,
 * and event dispatching for 3D terrain and HUD integration.
 */

class SimulationEngine {
  constructor() {
    this.currentHazard = null; // null | 'flood' | 'fire' | 'landslide'
    this.currentStage = 1;
    this.maxStages = 8;
    this.isPlaying = false;
    this.playTimer = null;
    this.stepIntervalMs = 2800; // 2.8s per step for realistic presentation

    // Baseline Sensor State
    this.baselineState = {
      rainfall: 14,             // mm
      soilMoisture: 68,         // %
      soilInfiltration: 42,     // mm/hr
      ndvi: 0.51,               // 0..1
      canopyCoverage: 24.2,     // %
      bareSoil: 75.8,           // %
      temperature: 28,          // °C
      humidity: 58,             // %
      windSpeed: 12,            // km/h
      slope: 26.4,              // deg
      lidarDisplacement: 0.0,   // cm
      runoffVelocity: 0.4,      // m/s
      floodRisk: 18,            // % (LOW)
      wildfireRisk: 12,         // % (LOW)
      landslideRisk: 23,        // % (LOW)
      ecologicalHealth: 'MODERATE'
    };

    // Active Live State
    this.state = { ...this.baselineState };

    // Stage Definitions for Each Hazard
    this.hazardStages = {
      flood: [
        {
          num: 1,
          title: "Normal Environmental Condition",
          desc: "Stable baseline landscape. Soil moisture normal at 68%, infiltration capacity at 42 mm/hr.",
          metrics: { rainfall: 14, soilMoisture: 68, runoffVelocity: 0.4, floodRisk: 18 },
          riskLevel: "LOW"
        },
        {
          num: 2,
          title: "Heavy Rainfall Incursion",
          desc: "Intense convective precipitation begins over the catchment basin. Simulated rainfall reaches 120 mm.",
          metrics: { rainfall: 120, soilMoisture: 76, runoffVelocity: 0.9, floodRisk: 34 },
          riskLevel: "LOW"
        },
        {
          num: 3,
          title: "Soil Moisture Saturation",
          desc: "Bhoomi-Probe detects pore water saturation. Infiltration rate drops from 42 to 16 mm/hr as soil reaches field capacity.",
          metrics: { rainfall: 135, soilMoisture: 88, runoffVelocity: 1.4, floodRisk: 52 },
          riskLevel: "MEDIUM"
        },
        {
          num: 4,
          title: "Surface Overland Runoff Initiates",
          desc: "Rainfall exceeds soil infiltration rate. Sheet runoff begins accumulating across exposed slopes.",
          metrics: { rainfall: 145, soilMoisture: 93, runoffVelocity: 2.1, floodRisk: 66 },
          riskLevel: "MEDIUM"
        },
        {
          num: 5,
          title: "Water Converges in Erosion Channels",
          desc: "Runoff funnels through active erosion gullies identified by LiDAR and Drishti-Cam. Water velocity surges to 2.8 m/s.",
          metrics: { rainfall: 155, soilMoisture: 96, runoffVelocity: 2.8, floodRisk: 74 },
          riskLevel: "HIGH"
        },
        {
          num: 6,
          title: "Low Canopy Amplifies Hydrological Surge",
          desc: "Due to 75.8% bare soil and only 24.2% canopy interception, rainfall energy directly dislodges topsoil into water channels.",
          metrics: { rainfall: 160, soilMoisture: 98, runoffVelocity: 3.4, floodRisk: 82 },
          riskLevel: "HIGH"
        },
        {
          num: 7,
          title: "Flood-Risk Zone Expands Across River Basin",
          desc: "Waterfront zone and agricultural boundary submerge under flash inundation threat. Runoff volume exceeds catchment capacity.",
          metrics: { rainfall: 165, soilMoisture: 99, runoffVelocity: 3.9, floodRisk: 88 },
          riskLevel: "HIGH"
        },
        {
          num: 8,
          title: "AI Early Warning Dispatched",
          desc: "⚠️ FLASH FLOOD RISK: HIGH (88%). Simulated lead time: 4–5 DAYS. Autonomous Afforestation & Riparian Restoration Plan dispatched.",
          metrics: { rainfall: 165, soilMoisture: 99, runoffVelocity: 4.1, floodRisk: 91 },
          riskLevel: "CRITICAL",
          isAlert: true
        }
      ],

      fire: [
        {
          num: 1,
          title: "Dry Seasonal Vegetation Detected",
          desc: "Post-monsoon dry spell. Ambient temperature reaches 36°C, humidity settles at 32%.",
          metrics: { temperature: 36, humidity: 32, ndvi: 0.48, wildfireRisk: 22 },
          riskLevel: "LOW"
        },
        {
          num: 2,
          title: "Atmospheric Humidity Plunges",
          desc: "Desiccating katabatic winds decrease relative humidity to 16%. Forest floor combustible duff dries out.",
          metrics: { temperature: 39, humidity: 16, ndvi: 0.42, wildfireRisk: 38 },
          riskLevel: "LOW"
        },
        {
          num: 3,
          title: "NDVI Sensor Detects Chlorophyll Depletion",
          desc: "Canopy NDVI drops from 0.51 to 0.28 indicating acute botanical water stress and flammable dry foliage.",
          metrics: { temperature: 41, humidity: 14, ndvi: 0.28, wildfireRisk: 54 },
          riskLevel: "MEDIUM"
        },
        {
          num: 4,
          title: "Dry Biomass Accumulates as Combustible Fuel",
          desc: "Fine dead fuel moisture drops below critical 6% threshold across Zone 3 (Ridge / Forest fringe).",
          metrics: { temperature: 42, humidity: 12, ndvi: 0.22, wildfireRisk: 68 },
          riskLevel: "MEDIUM"
        },
        {
          num: 5,
          title: "Simulated Ignition Point Triggers",
          desc: "Simulated thermal anomaly or lightning strike ignites dry brushwood along the upper eastern ridge.",
          metrics: { temperature: 44, humidity: 11, windSpeed: 28, wildfireRisk: 76 },
          riskLevel: "HIGH"
        },
        {
          num: 6,
          title: "Wind-Driven Fire Spread Across Ridgeline",
          desc: "28 km/h wind gusts propel fire front across dry brush corridors toward contiguous forest zones.",
          metrics: { temperature: 46, humidity: 10, windSpeed: 34, wildfireRisk: 84 },
          riskLevel: "HIGH"
        },
        {
          num: 7,
          title: "AI Identifies High-Risk Forest Perimeter",
          desc: "Drishti-Cam & thermal multi-spectral fusion detects breach vector threatening 8.4 hectares of forest reserve.",
          metrics: { temperature: 47, humidity: 9, windSpeed: 36, wildfireRisk: 89 },
          riskLevel: "HIGH"
        },
        {
          num: 8,
          title: "AI Early Warning + Green Firebreak Strategy",
          desc: "🔥 WILDFIRE RISK: HIGH (92%). Green firebreak buffer recommendation calculated: Plant fire-resilient broadleaf trees in Zone 3.",
          metrics: { temperature: 48, humidity: 9, windSpeed: 38, wildfireRisk: 92 },
          riskLevel: "CRITICAL",
          isAlert: true
        }
      ],

      landslide: [
        {
          num: 1,
          title: "Stable Hillside Equilibrium",
          desc: "Normal hillside slope (26.4°). Factor of Safety (FoS) stable at 1.62. Topsoil held by sparse roots.",
          metrics: { slope: 26.4, rainfall: 18, soilMoisture: 68, lidarDisplacement: 0.0, landslideRisk: 23 },
          riskLevel: "LOW"
        },
        {
          num: 2,
          title: "Precipitation Infiltration Surge",
          desc: "Continuous heavy precipitation (110 mm) percolates down to the shear slip interface between soil and bedrock.",
          metrics: { slope: 26.4, rainfall: 110, soilMoisture: 82, lidarDisplacement: 0.4, landslideRisk: 39 },
          riskLevel: "LOW"
        },
        {
          num: 3,
          title: "Pore Water Pressure Spikes",
          desc: "Internal hydrostatic pore pressure rises to 52 kPa, reducing frictional shear resistance of the steep slope.",
          metrics: { slope: 26.5, rainfall: 135, soilMoisture: 92, lidarDisplacement: 1.2, landslideRisk: 55 },
          riskLevel: "MEDIUM"
        },
        {
          num: 4,
          title: "Slope Factor of Safety Drops Critical",
          desc: "Slope shear stress approaches mechanical shear strength. FoS drops below 1.15 due to lack of deep anchor roots.",
          metrics: { slope: 26.7, rainfall: 150, soilMoisture: 96, lidarDisplacement: 3.5, landslideRisk: 69 },
          riskLevel: "MEDIUM"
        },
        {
          num: 5,
          title: "Tension Cracks Emerge on Upper Slope",
          desc: "Drishti-Cam edge vision detects longitudinal fissures and surface slip lines along the 26.4° slope terrace.",
          metrics: { slope: 27.1, rainfall: 160, soilMoisture: 98, lidarDisplacement: 7.8, landslideRisk: 78 },
          riskLevel: "HIGH"
        },
        {
          num: 6,
          title: "LiDAR Telemetry Confirms Topographic Shift",
          desc: "LiDAR delta scan reveals +14.2 cm surface deformation and active colluvial displacement along the western face.",
          metrics: { slope: 27.4, rainfall: 165, soilMoisture: 99, lidarDisplacement: 14.2, landslideRisk: 85 },
          riskLevel: "HIGH"
        },
        {
          num: 7,
          title: "AI Delineates Vulnerable Colluvial Zone",
          desc: "Geotechnical model isolates 5.6-hectare active failure slip envelope. Immediate bioengineering intervention required.",
          metrics: { slope: 27.8, rainfall: 170, soilMoisture: 99, lidarDisplacement: 18.6, landslideRisk: 89 },
          riskLevel: "HIGH"
        },
        {
          num: 8,
          title: "AI Early Warning + Slope Bioengineering Plan",
          desc: "⛰️ LANDSLIDE RISK: HIGH (93%). Deep-rooted native species (*Azadirachta*, *Syzygium*) + Vetiver contour stabilization generated.",
          metrics: { slope: 28.0, rainfall: 170, soilMoisture: 100, lidarDisplacement: 22.4, landslideRisk: 93 },
          riskLevel: "CRITICAL",
          isAlert: true
        }
      ]
    };

    // Listeners for UI state syncing
    this.listeners = [];
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.getSnapshot()));
  }

  getSnapshot() {
    const activeStageDef = this.currentHazard 
      ? this.hazardStages[this.currentHazard][this.currentStage - 1] 
      : null;

    return {
      hazard: this.currentHazard,
      stage: this.currentStage,
      maxStages: this.maxStages,
      isPlaying: this.isPlaying,
      stageDef: activeStageDef,
      stagesList: this.currentHazard ? this.hazardStages[this.currentHazard] : [],
      state: { ...this.state }
    };
  }

  /**
   * Starts a simulation for a specific hazard
   * @param {'flood'|'fire'|'landslide'} hazardName
   */
  startHazard(hazardName) {
    if (!this.hazardStages[hazardName]) return;
    this.stopPlayback();
    this.currentHazard = hazardName;
    this.currentStage = 1;
    this.applyStage(1);
    this.play();
  }

  /**
   * Resets simulation to stable baseline
   */
  resetToBaseline() {
    this.stopPlayback();
    this.currentHazard = null;
    this.currentStage = 1;
    this.state = { ...this.baselineState };
    this.notify();
  }

  /**
   * Sets specific stage
   * @param {number} stageNum (1..8)
   */
  setStage(stageNum) {
    if (!this.currentHazard) return;
    if (stageNum < 1) stageNum = 1;
    if (stageNum > this.maxStages) stageNum = this.maxStages;
    this.currentStage = stageNum;
    this.applyStage(stageNum);
  }

  nextStage() {
    if (!this.currentHazard) return;
    if (this.currentStage < this.maxStages) {
      this.setStage(this.currentStage + 1);
    } else {
      this.pause();
    }
  }

  prevStage() {
    if (!this.currentHazard) return;
    if (this.currentStage > 1) {
      this.setStage(this.currentStage - 1);
    }
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.playTimer = setInterval(() => {
      if (this.currentStage < this.maxStages) {
        this.nextStage();
      } else {
        this.pause();
      }
    }, this.stepIntervalMs);
    this.notify();
  }

  pause() {
    this.stopPlayback();
    this.notify();
  }

  stopPlayback() {
    this.isPlaying = false;
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
  }

  applyStage(stageNum) {
    if (!this.currentHazard) return;
    const stages = this.hazardStages[this.currentHazard];
    const stageData = stages[stageNum - 1];
    if (!stageData) return;

    // Merge stage metrics into state
    Object.assign(this.state, stageData.metrics);

    // Compute Multi-Sensor Fusion Formulas
    this.calculateRiskFormulas();

    this.notify();

    // Trigger Warning modal and Audio if final alert stage
    if (stageData.isAlert) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('bhoomi:early-warning', {
          detail: {
            hazard: this.currentHazard,
            stageData: stageData,
            state: this.state
          }
        }));
      }, 500);
    }
  }

  /**
   * Multi-Sensor AI Fusion Formulas
   */
  calculateRiskFormulas() {
    const s = this.state;
    
    // Flood Risk Model Formula:
    // 0.30*Rainfall + 0.25*SoilMoisture + 0.20*BareSoil + 0.15*Slope + 0.10*RunoffVelocity
    if (this.currentHazard !== 'flood') {
      const floodScore = (
        (s.rainfall / 160) * 30 +
        (s.soilMoisture / 100) * 25 +
        (s.bareSoil / 100) * 20 +
        (s.slope / 45) * 15 +
        (s.runoffVelocity / 4.0) * 10
      );
      s.floodRisk = Math.min(99, Math.max(8, Math.round(floodScore)));
    }

    // Wildfire Risk Model Formula:
    // 0.25*Temp + 0.25*(100-Humidity) + 0.20*(1-NDVI) + 0.15*Wind + 0.15*Fuel
    if (this.currentHazard !== 'fire') {
      const fireScore = (
        (s.temperature / 50) * 25 +
        ((100 - s.humidity) / 100) * 25 +
        ((1.0 - s.ndvi) / 1.0) * 20 +
        (s.windSpeed / 50) * 15 +
        (s.bareSoil / 100) * 15
      );
      s.wildfireRisk = Math.min(99, Math.max(6, Math.round(fireScore)));
    }

    // Landslide Risk Model Formula:
    // 0.30*Slope + 0.25*SoilMoisture + 0.20*LiDAR Slip + 0.15*Rainfall + 0.10*Erosion
    if (this.currentHazard !== 'landslide') {
      const slideScore = (
        (s.slope / 45) * 30 +
        (s.soilMoisture / 100) * 25 +
        (Math.min(s.lidarDisplacement, 20) / 20) * 20 +
        (s.rainfall / 160) * 15 +
        (s.bareSoil / 100) * 10
      );
      s.landslideRisk = Math.min(99, Math.max(10, Math.round(slideScore)));
    }
  }
}

window.bhoomiSim = new SimulationEngine();
