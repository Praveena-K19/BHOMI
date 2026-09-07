/**
 * BHOOMI-Net 2.0 - Judge Demo Mode (Presentation Walkthrough Engine)
 * Automates the complete 15-step narrative tour for competition judges:
 * Sensing -> Analysis -> Hazard Simulation -> Early Warning -> Afforestation
 * -> Species Selection -> GPS Placement -> Mitigation -> Monitoring.
 */

class JudgeDemoMode {
  constructor() {
    this.currentStep = 0;
    this.totalSteps = 15;
    this.isRunning = false;
    this.stepTimeout = null;

    this.steps = [
      {
        step: 1,
        tab: 'monitoring',
        duration: 3500,
        text: "1/15: Initializing BHOOMI-Net 2.0 digital twin. Stable baseline ecosystem monitored across 10 hectares.",
        action: () => {
          if (window.bhoomiSim) window.bhoomiSim.resetToBaseline();
          if (window.bhoomiApp) window.bhoomiApp.setAfforestationSlider(0);
        }
      },
      {
        step: 2,
        tab: 'monitoring',
        duration: 3500,
        text: "2/15: Multi-sensor mesh online. Ingesting Bhoomi-Probe soil moisture, LiDAR slope (26.4°), and NDVI vegetation health.",
        action: () => {
          this.pulseElement('.sensors-grid');
        }
      },
      {
        step: 3,
        tab: 'drishti',
        duration: 4000,
        text: "3/15: Drishti-Cam edge computer vision scanning hillside. Identifies 24.2% canopy and 75.8% bare soil vulnerable to erosion.",
        action: () => {
          if (window.bhoomiCam) window.bhoomiCam.resize();
        }
      },
      {
        step: 4,
        tab: 'simulation',
        duration: 3800,
        text: "4/15: Initiating Flash Flood hazard simulation. Convective storm arrives; simulated rainfall spikes to 120 mm.",
        action: () => {
          if (window.bhoomiSim) {
            window.bhoomiSim.currentHazard = 'flood';
            window.bhoomiSim.setStage(2);
          }
        }
      },
      {
        step: 5,
        tab: 'simulation',
        duration: 3800,
        text: "5/15: Soil moisture saturates to 96%. Surface runoff funnels into active erosion gullies at 2.8 m/s.",
        action: () => {
          if (window.bhoomiSim) window.bhoomiSim.setStage(5);
        }
      },
      {
        step: 6,
        tab: 'terrain',
        duration: 4000,
        text: "6/15: 3D Digital Twin visualizes flood surge along the river basin. Unprotected hillside generates extreme runoff volume.",
        action: () => {
          if (window.bhoomiTerrain) {
            window.bhoomiTerrain.updateHazardVisuals('flood', 6);
            window.bhoomiTerrain.setCameraPreset('riverbed');
          }
        }
      },
      {
        step: 7,
        tab: 'simulation',
        duration: 4200,
        text: "7/15: AI Early Warning triggered! FLASH FLOOD RISK: HIGH (88%). Simulated lead time: 4–5 Days.",
        action: () => {
          if (window.bhoomiSim) window.bhoomiSim.setStage(8);
          if (window.bhoomiAudio) {
            window.bhoomiAudio.playSiren(3000);
            window.bhoomiAudio.speakVoiceAlert('Flash Flood', 'HIGH');
          }
        }
      },
      {
        step: 8,
        tab: 'afforestation',
        duration: 4000,
        text: "8/15: Transitioning to autonomous AI Afforestation Engine. Synthesizing multi-sensor data to engineer ecological solution.",
        action: () => {
          this.pulseElement('.afforest-summary-grid');
        }
      },
      {
        step: 9,
        tab: 'afforestation',
        duration: 3800,
        text: "9/15: Landscape segmented into 3 ecological zones: Zone 1 (Waterfront), Zone 2 (Hillside 26.4°), Zone 3 (Ridge).",
        action: () => {
          this.pulseElement('.zones-grid');
        }
      },
      {
        step: 10,
        tab: 'afforestation',
        duration: 4000,
        text: "10/15: Native species matched to geotechnical needs: Arjuna & Bamboo for riverbank; Deep-rooted Neem & Vetiver for slope stability.",
        action: () => {}
      },
      {
        step: 11,
        tab: 'afforestation',
        duration: 3600,
        text: "11/15: Model calculates ~4,850 saplings needed across 10 hectares with strict spacing (3.5m to 5.5m).",
        action: () => {}
      },
      {
        step: 12,
        tab: 'gps-map',
        duration: 4200,
        text: "12/15: GPS Planting Optimizer generates 65+ geo-coordinates. Placement rules strictly avoid roads, cliffs, and existing canopy.",
        action: () => {
          if (window.bhoomiGPSMap) window.bhoomiGPSMap.invalidateSize();
        }
      },
      {
        step: 13,
        tab: 'terrain',
        duration: 4500,
        text: "13/15: Visualizing AI afforestation in 3D digital twin. Saplings planted along designated contour intervals.",
        action: () => {
          if (window.bhoomiTerrain) {
            window.bhoomiTerrain.setCameraPreset('slope');
            window.bhoomiTerrain.setLayer('plantingLocations', true);
          }
          if (window.bhoomiApp) window.bhoomiApp.setAfforestationSlider(0.5);
        }
      },
      {
        step: 14,
        tab: 'terrain',
        duration: 4500,
        text: "14/15: Simulating 5-year growth. Canopy expands to 68.5%; bare soil drops to 31.5%; runoff coefficient falls by 66%.",
        action: () => {
          if (window.bhoomiApp) window.bhoomiApp.setAfforestationSlider(1.0);
          if (window.bhoomiTerrain) {
            window.bhoomiTerrain.updateHazardVisuals('flood', 1);
            window.bhoomiTerrain.setCameraPreset('drone');
          }
        }
      },
      {
        step: 15,
        tab: 'analytics',
        duration: 6000,
        text: "15/15: BHOOMI-Net does not simply warn about hazards. It identifies vulnerable land, recommends ecological intervention, and continuously monitors the outcome.",
        action: () => {
          if (window.bhoomiAnalytics) window.bhoomiAnalytics.resizeAll();
        }
      }
    ];
  }

  start() {
    if (this.isRunning) {
      this.stop();
      return;
    }

    this.isRunning = true;
    this.currentStep = 0;

    const banner = document.getElementById('judge-demo-banner');
    const demoBtn = document.getElementById('btn-judge-demo');
    if (banner) banner.classList.add('active');
    if (demoBtn) {
      demoBtn.textContent = '⏹ STOP DEMO';
      demoBtn.style.background = 'linear-gradient(135deg, #ff3366, #e91e63)';
    }

    this.executeStep(0);
  }

  stop() {
    this.isRunning = false;
    if (this.stepTimeout) {
      clearTimeout(this.stepTimeout);
      this.stepTimeout = null;
    }

    const banner = document.getElementById('judge-demo-banner');
    const demoBtn = document.getElementById('btn-judge-demo');
    if (banner) banner.classList.remove('active');
    if (demoBtn) {
      demoBtn.innerHTML = '🏆 JUDGE DEMO MODE';
      demoBtn.style.background = 'linear-gradient(135deg, #ffb300, #ff8f00)';
    }

    if (window.bhoomiAudio) window.bhoomiAudio.stopSiren();
  }

  executeStep(index) {
    if (!this.isRunning || index >= this.steps.length) {
      this.stop();
      return;
    }

    this.currentStep = index;
    const stepData = this.steps[index];

    // Update banner UI
    const counterEl = document.getElementById('demo-step-counter');
    const textEl = document.getElementById('demo-narration-text');
    if (counterEl) counterEl.textContent = `STEP [${String(stepData.step).padStart(2, '0')} / 15]`;
    if (textEl) textEl.textContent = stepData.text;

    // Switch tab
    if (window.bhoomiApp && stepData.tab) {
      window.bhoomiApp.switchTab(stepData.tab);
    }

    // Execute step specific action
    if (typeof stepData.action === 'function') {
      try {
        stepData.action();
      } catch (err) {
        console.error("Error executing demo step action:", err);
      }
    }

    // Schedule next step
    this.stepTimeout = setTimeout(() => {
      this.executeStep(index + 1);
    }, stepData.duration);
  }

  pulseElement(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.style.transition = 'box-shadow 0.4s ease';
    el.style.boxShadow = '0 0 30px rgba(0, 240, 152, 0.6)';
    setTimeout(() => {
      el.style.boxShadow = '';
    }, 1800);
  }
}

window.bhoomiDemo = new JudgeDemoMode();
