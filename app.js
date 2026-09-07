/**
 * BHOOMI-Net 2.0 - Master Application Coordinator & Event Hub
 * Connects all subsystems: Sensor Telemetry, Drishti-Cam, 8-Stage Hazard Simulator,
 * AI Afforestation Engine, Three.js 3D Digital Twin, Leaflet GPS Map,
 * Chart.js Analytics, Audio Alerts, and Judge Demo Mode.
 */

class BhoomiApp {
  constructor() {
    this.activeTab = 'monitoring';
    this.afforestationSliderVal = 0; // 0..100
    this.telemetryInterval = null;
  }

  init() {
    console.log("Initializing BHOOMI-Net 2.0 Command Center...");

    // 1. Initialize Subsystems
    this.initSubsystems();

    // 2. Setup Navigation Tab Listeners
    this.setupTabRouting();

    // 3. Setup Top Metric Watchers
    this.setupMetricWatchers();

    // 4. Setup Simulation Center Controls
    this.setupSimulationControls();

    // 5. Setup Fire response, people safety and responder routing
    this.setupFireResponse();

    // 6. Setup Afforestation & 3D Morphing Slider
    this.setupAfforestationControls();

    // 6. Setup Drishti-Cam Layer Toggles
    this.setupDrishtiCamControls();

    // 7. Setup 3D Layer & Camera Controls
    this.setupTerrain3DControls();

    // 8. Setup GPS Map Filter Buttons
    this.setupGPSMapControls();

    // 9. Setup Narrative Pipeline Ribbon
    this.setupPipelineRibbon();

    // 10. Setup Modal Handlers (Early Warning & Action Plan)
    this.setupModals();

    // 11. Start live telemetry micro-fluctuations
    this.startTelemetryHeartbeat();

    // 12. Setup Judge Demo Mode button
    const demoBtn = document.getElementById('btn-judge-demo');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        if (window.bhoomiDemo) window.bhoomiDemo.start();
      });
    }

    const stopDemoBtn = document.getElementById('btn-demo-stop');
    if (stopDemoBtn) {
      stopDemoBtn.addEventListener('click', () => {
        if (window.bhoomiDemo) window.bhoomiDemo.stop();
      });
    }

    console.log("BHOOMI-Net 2.0 Command Center Ready.");
  }

  initSubsystems() {
    // 1. Drishti-Cam Simulator
    if (typeof DrishtiCamSimulator !== 'undefined') {
      window.bhoomiCam = new DrishtiCamSimulator('drishti-cam-canvas');
    }

    // 2. Three.js 3D Digital Twin
    if (typeof Terrain3DDigitalTwin !== 'undefined') {
      window.bhoomiTerrain = new Terrain3DDigitalTwin('terrain3d-canvas');
    }

    // 3. Leaflet GPS Map
    if (typeof GPSPlantingMap !== 'undefined') {
      window.bhoomiGPSMap = new GPSPlantingMap('leaflet-gps-map');
    }

    // 4. Chart.js Analytics
    if (window.bhoomiAnalytics) {
      window.bhoomiAnalytics.init();
    }
  }

  setupTabRouting() {
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;

    // Navigation behaves like separate app pages while remaining a single-file SPA.
    document.body.setAttribute('data-active-page', tabId);

    // Update active state on nav buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Show the dashboard story/metrics only on the Live Monitoring page.
    const monitoringContext = document.getElementById('monitoring-context');
    if (monitoringContext) {
      monitoringContext.hidden = tabId !== 'monitoring';
    }

    // Update active pane
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });

    // Move the user to the top of the newly selected page instead of leaving
    // them at the scroll position of the previous page.
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Trigger subsystem resizes
    if (tabId === 'drishti' && window.bhoomiCam) {
      window.bhoomiCam.resize();
    }
    if (tabId === 'terrain' && window.bhoomiTerrain) {
      window.bhoomiTerrain.onResize();
    }
    if (tabId === 'gps-map' && window.bhoomiGPSMap) {
      window.bhoomiGPSMap.invalidateSize();
    }
    if (tabId === 'analytics' && window.bhoomiAnalytics) {
      window.bhoomiAnalytics.resizeAll();
    }
  }

  setupMetricWatchers() {
    // Subscribe to Simulation Engine Updates
    if (window.bhoomiSim) {
      window.bhoomiSim.onUpdate(snapshot => {
        this.updateDashboardMetrics(snapshot);
        this.updateSimulationUI(snapshot);

        // Update 3D visuals
        if (window.bhoomiTerrain) {
          window.bhoomiTerrain.updateHazardVisuals(snapshot.hazard, snapshot.stage);
        }
      });
    }
  }

  updateDashboardMetrics(snapshot) {
    const s = snapshot.state;

    // 1. Flood Card
    this.updateCard('metric-flood-val', 'metric-flood-badge', 'metric-flood-bar', s.floodRisk, '%');

    // 2. Wildfire Card
    this.updateCard('metric-fire-val', 'metric-fire-badge', 'metric-fire-bar', s.wildfireRisk, '%');

    // 3. Landslide Card
    this.updateCard('metric-slide-val', 'metric-slide-badge', 'metric-slide-bar', s.landslideRisk, '%');

    // 4. Canopy Coverage Card
    const canopyValEl = document.getElementById('metric-canopy-val');
    const canopyBarEl = document.getElementById('metric-canopy-bar');
    if (canopyValEl) canopyValEl.textContent = `${s.canopyCoverage.toFixed(1)}%`;
    if (canopyBarEl) canopyBarEl.style.width = `${Math.min(100, s.canopyCoverage)}%`;

    // 5. Update Telemetry Sensor Panels in Monitoring Tab
    this.setText('live-bhoomi-moisture', `${s.soilMoisture.toFixed(0)}%`);
    this.setText('live-bhoomi-infil', `${s.soilInfiltration.toFixed(0)} mm/hr`);
    this.setText('live-ndvi-val', s.ndvi.toFixed(2));
    this.setText('live-lidar-slope', `${s.slope.toFixed(1)}°`);
    this.setText('live-lidar-slip', `${s.lidarDisplacement.toFixed(1)} cm`);
    this.setText('live-drishti-canopy', `${s.canopyCoverage.toFixed(1)}%`);
    this.setText('live-drishti-soil', `${s.bareSoil.toFixed(1)}%`);

    // Update Drishti-Cam internal telemetry
    if (window.bhoomiCam) {
      window.bhoomiCam.updateTelemetry({
        canopyCoverage: s.canopyCoverage,
        bareSoil: s.bareSoil,
        slopeAngle: s.slope
      });
    }
  }

  updateCard(valId, badgeId, barId, val, unit) {
    const valEl = document.getElementById(valId);
    const badgeEl = document.getElementById(badgeId);
    const barEl = document.getElementById(barId);

    if (valEl) valEl.textContent = `${val}${unit}`;
    if (barEl) barEl.style.width = `${Math.min(100, val)}%`;

    if (badgeEl) {
      badgeEl.className = 'metric-badge';
      if (val < 35) {
        badgeEl.textContent = 'LOW';
        badgeEl.classList.add('badge-low');
      } else if (val < 70) {
        badgeEl.textContent = 'MODERATE';
        badgeEl.classList.add('badge-med');
      } else {
        badgeEl.textContent = 'HIGH';
        badgeEl.classList.add('badge-high');
      }
    }
  }

  setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  setupSimulationControls() {
    // Hazard Buttons
    const btnFlood = document.getElementById('btn-sim-flood');
    const btnFire = document.getElementById('btn-sim-fire');
    const btnSlide = document.getElementById('btn-sim-slide');
    const btnReset = document.getElementById('btn-sim-reset');

    if (btnFlood) {
      btnFlood.addEventListener('click', () => {
        this.setSimHazardActive('flood');
        window.bhoomiSim.startHazard('flood');
      });
    }
    if (btnFire) {
      btnFire.addEventListener('click', () => {
        this.setSimHazardActive('fire');
        window.bhoomiSim.startHazard('fire');
      });
    }
    if (btnSlide) {
      btnSlide.addEventListener('click', () => {
        this.setSimHazardActive('slide');
        window.bhoomiSim.startHazard('landslide');
      });
    }
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.setSimHazardActive(null);
        window.bhoomiSim.resetToBaseline();
        this.setAfforestationSlider(0);
      });
    }

    // Playback Controls
    const btnPlayPause = document.getElementById('btn-sim-playpause');
    const btnPrev = document.getElementById('btn-sim-prev');
    const btnNext = document.getElementById('btn-sim-next');

    if (btnPlayPause) {
      btnPlayPause.addEventListener('click', () => {
        if (window.bhoomiSim.isPlaying) {
          window.bhoomiSim.pause();
        } else {
          window.bhoomiSim.play();
        }
      });
    }
    if (btnPrev) {
      btnPrev.addEventListener('click', () => window.bhoomiSim.prevStage());
    }
    if (btnNext) {
      btnNext.addEventListener('click', () => window.bhoomiSim.nextStage());
    }
  }

  setSimHazardActive(type) {
    document.querySelectorAll('.btn-hazard').forEach(b => b.classList.remove('active'));
    if (type) {
      const activeBtn = document.getElementById(`btn-sim-${type}`);
      if (activeBtn) activeBtn.classList.add('active');
    }
  }

  updateSimulationUI(snapshot) {
    const { hazard, stage, isPlaying, stagesList, stageDef } = snapshot;

    // Play / Pause Icon
    const playPauseBtn = document.getElementById('btn-sim-playpause');
    if (playPauseBtn) {
      playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
    }

    // Timeline Stepper
    const timelineEl = document.getElementById('sim-timeline-stepper');
    if (timelineEl && stagesList.length > 0) {
      timelineEl.innerHTML = '';

      stagesList.forEach(s => {
        const item = document.createElement('div');
        item.className = 'stage-item';

        if (s.num < stage) item.classList.add('completed');
        if (s.num === stage) {
          item.classList.add('current');
          if (s.isAlert) item.classList.add('alert-stage');
        }

        item.addEventListener('click', () => {
          window.bhoomiSim.setStage(s.num);
        });

        // Metric highlight string
        let metricTxt = '';
        if (s.metrics.rainfall) metricTxt += `Rain: ${s.metrics.rainfall}mm • `;
        if (s.metrics.soilMoisture) metricTxt += `Soil Moist: ${s.metrics.soilMoisture}% • `;
        if (s.metrics.temperature) metricTxt += `Temp: ${s.metrics.temperature}°C • `;
        if (s.metrics.slope) metricTxt += `Slope: ${s.metrics.slope}° • `;
        if (s.metrics.runoffVelocity) metricTxt += `Runoff V: ${s.metrics.runoffVelocity}m/s`;

        item.innerHTML = `
          <div class="stage-badge-num">${s.num}</div>
          <div class="stage-text">
            <h5>${s.title}</h5>
            <p>${s.desc}</p>
            ${metricTxt ? `<div class="stage-metric-highlight">Telemetry: ${metricTxt}</div>` : ''}
          </div>
        `;
        timelineEl.appendChild(item);
      });
    } else if (timelineEl) {
      timelineEl.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 0.85rem;">
          🌱 System is in Stable Baseline Equilibrium.<br/>
          Click <b>Simulate Flash Flood</b>, <b>Wildfire</b>, or <b>Landslide</b> above to observe hazard progression step-by-step.
        </div>
      `;
    }

    // Current Status Diagnostics Box
    const statusBox = document.getElementById('sim-active-hazard-badge');
    if (statusBox) {
      statusBox.textContent = hazard ? `${hazard.toUpperCase()} (STAGE ${stage}/8)` : 'STABLE BASELINE';
      statusBox.className = 'metric-badge';
      if (!hazard) statusBox.classList.add('badge-low');
      else if (stage < 5) statusBox.classList.add('badge-med');
      else statusBox.classList.add('badge-high');
    }
  }

  setupFireResponse() {
    const alertPeople = document.getElementById('btn-alert-people');
    const notifyOfficer = document.getElementById('btn-notify-officer');
    const showRoute = document.getElementById('btn-show-route');
    const status = document.getElementById('fire-response-status');
    const dispatch = document.getElementById('officer-dispatch');
    const routeBox = document.getElementById('safe-route-box');

    if (alertPeople) {
      alertPeople.addEventListener('click', () => {
        if (status) status.textContent = 'PUBLIC ALERT DISPATCHED • EAST RIDGE SECTOR';
        status?.classList.add('active');
        if (window.bhoomiAudio) {
          window.bhoomiAudio.playSiren(3500);
          window.bhoomiAudio.speakVoiceAlert('Wildfire', 'HIGH', 'Emergency alert. Simulated wildfire detected at East Ridge Sector, Node 03. Residents within the marked risk zone should move to North Gate Community Ground. Follow official evacuation instructions.');
        }
      });
    }

    if (notifyOfficer) {
      notifyOfficer.addEventListener('click', () => {
        if (status) status.textContent = 'OFFICER NOTIFIED • RESPONSE REQUEST SENT';
        status?.classList.add('active');
        if (dispatch) {
          dispatch.hidden = false;
          const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
          const msg = document.getElementById('officer-message');
          if (msg) msg.innerHTML = `<b>${time}</b> — Simulated wildfire detected at <b>East Ridge Sector • Node-03</b> (${document.getElementById('fire-location-gps')?.textContent || ''}). Estimated people in 500 m risk zone: <b>27</b>. Proceed via <b>North Gate → Service Road → East Ridge Sector</b>. Avoid eastern forest track.`;
        }
      });
    }

    if (showRoute) {
      showRoute.addEventListener('click', () => {
        if (routeBox) routeBox.hidden = false;
        if (status) status.textContent = 'SAFE RESPONDER ROUTE DISPLAYED';
        status?.classList.add('active');
      });
    }

    window.addEventListener('bhoomi:early-warning', (e) => {
      if (e.detail?.hazard === 'fire') {
        if (status) status.textContent = '🔥 FIRE CONFIRMED IN SIMULATION • LOCATION IDENTIFIED';
        status?.classList.add('active');
        if (dispatch) dispatch.hidden = false;
        if (routeBox) routeBox.hidden = false;
      }
    });
  }

    setupAfforestationControls() {
    const slider = document.getElementById('afforest-morph-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        this.setAfforestationSlider(val);
      });
    }
  }

  setAfforestationSlider(val) {
    this.afforestationSliderVal = val;
    const slider = document.getElementById('afforest-morph-slider');
    if (slider) slider.value = Math.round(val * 100);

    // Dynamic metrics calculation based on slider progress:
    // Canopy: 24.2% -> 68.5%
    // Bare Soil: 75.8% -> 31.5%
    // Runoff index: 84 -> 28
    // Landslide Factor of Safety: 1.15 -> 1.85
    const canopy = 24.2 + (68.5 - 24.2) * val;
    const bareSoil = 75.8 - (75.8 - 31.5) * val;
    const runoffIdx = Math.round(84 - (84 - 28) * val);
    const fos = (1.15 + (1.85 - 1.15) * val).toFixed(2);

    // Update Live State
    if (window.bhoomiSim) {
      window.bhoomiSim.state.canopyCoverage = canopy;
      window.bhoomiSim.state.bareSoil = bareSoil;
      window.bhoomiSim.calculateRiskFormulas();
      this.updateDashboardMetrics(window.bhoomiSim.getSnapshot());
    }

    // Update 3D Digital Twin
    if (window.bhoomiTerrain) {
      window.bhoomiTerrain.setAfforestationProgress(val);
    }

    // Update Slider Diff Panel in UI
    this.setText('diff-canopy', `${canopy.toFixed(1)}% (+${((canopy - 24.2)).toFixed(1)}%)`);
    this.setText('diff-soil', `${bareSoil.toFixed(1)}% (-${((75.8 - bareSoil)).toFixed(1)}%)`);
    this.setText('diff-runoff', `${runoffIdx} / 100`);
    this.setText('diff-fos', `${fos} (Stable)`);
  }

  setupDrishtiCamControls() {
    const toggles = [
      { id: 'toggle-cam-canopy', layer: 'canopy' },
      { id: 'toggle-cam-soil', layer: 'bareSoil' },
      { id: 'toggle-cam-erosion', layer: 'erosion' },
      { id: 'toggle-cam-hazard', layer: 'hazard' },
      { id: 'toggle-cam-crosshair', layer: 'arCrosshairs' },
      { id: 'toggle-cam-scanlines', layer: 'scanlines' }
    ];

    toggles.forEach(({ id, layer }) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', (e) => {
          if (window.bhoomiCam) window.bhoomiCam.setLayer(layer, e.target.checked);
        });
      }
    });
  }

  setupTerrain3DControls() {
    // 3D Layer Toggles
    const layers = [
      { id: 'toggle-3d-veg', layer: 'vegetation' },
      { id: 'toggle-3d-water', layer: 'water' },
      { id: 'toggle-3d-slope', layer: 'slopeHeatmap' },
      { id: 'toggle-3d-fire', layer: 'fireRisk' },
      { id: 'toggle-3d-flood', layer: 'floodRisk' },
      { id: 'toggle-3d-pins', layer: 'plantingLocations' }
    ];

    layers.forEach(({ id, layer }) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', (e) => {
          if (window.bhoomiTerrain) window.bhoomiTerrain.setLayer(layer, e.target.checked);
        });
      }
    });

    // Camera Presets
    const presetBtns = document.querySelectorAll('.btn-cam-preset');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const preset = btn.getAttribute('data-preset');
        if (window.bhoomiTerrain) window.bhoomiTerrain.setCameraPreset(preset);
      });
    });
  }

  setupGPSMapControls() {
    const filterBtns = document.querySelectorAll('.map-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        if (window.bhoomiGPSMap) window.bhoomiGPSMap.setFilter(filter);
      });
    });
  }

  setupPipelineRibbon() {
    const steps = document.querySelectorAll('.pipeline-step');
    steps.forEach(step => {
      step.addEventListener('click', () => {
        steps.forEach(s => s.classList.remove('active'));
        step.classList.add('active');
        const targetTab = step.getAttribute('data-tab');
        if (targetTab) this.switchTab(targetTab);
      });
    });
  }

  setupModals() {
    // Early Warning Modal Event Handler
    window.addEventListener('bhoomi:early-warning', (e) => {
      this.showEarlyWarningModal(e.detail);
    });

    // Audio Alert Buttons inside Warning Modal
    const btnSiren = document.getElementById('btn-warning-siren');
    if (btnSiren) {
      btnSiren.addEventListener('click', () => {
        if (window.bhoomiAudio) window.bhoomiAudio.playSiren(4000);
      });
    }

    const btnVoice = document.getElementById('btn-warning-voice');
    if (btnVoice) {
      btnVoice.addEventListener('click', () => {
        const hazard = window.bhoomiSim ? window.bhoomiSim.currentHazard : 'Hazard';
        if (window.bhoomiAudio) window.bhoomiAudio.speakVoiceAlert(hazard, 'HIGH');
      });
    }

    const btnDismissWarning = document.getElementById('btn-warning-dismiss');
    if (btnDismissWarning) {
      btnDismissWarning.addEventListener('click', () => {
        const modal = document.getElementById('early-warning-modal');
        if (modal) modal.classList.remove('active');
        if (window.bhoomiAudio) window.bhoomiAudio.stopSiren();
      });
    }

    const btnProceedAfforest = document.getElementById('btn-warning-afforest');
    if (btnProceedAfforest) {
      btnProceedAfforest.addEventListener('click', () => {
        const modal = document.getElementById('early-warning-modal');
        if (modal) modal.classList.remove('active');
        if (window.bhoomiAudio) window.bhoomiAudio.stopSiren();
        this.switchTab('afforestation');
      });
    }

    // Action Plan Modal Trigger
    const btnGenPlan = document.getElementById('btn-generate-plan');
    if (btnGenPlan) {
      btnGenPlan.addEventListener('click', () => {
        this.showActionPlanReportModal();
      });
    }

    const btnCloseReport = document.getElementById('btn-report-close');
    if (btnCloseReport) {
      btnCloseReport.addEventListener('click', () => {
        const modal = document.getElementById('action-plan-modal');
        if (modal) modal.classList.remove('active');
      });
    }

    const btnDownloadCSV = document.getElementById('btn-download-csv');
    if (btnDownloadCSV) {
      btnDownloadCSV.addEventListener('click', () => {
        this.downloadGPSCSV();
      });
    }

    const btnPrintReport = document.getElementById('btn-print-report');
    if (btnPrintReport) {
      btnPrintReport.addEventListener('click', () => {
        window.print();
      });
    }
  }

  showEarlyWarningModal(detail) {
    const modal = document.getElementById('early-warning-modal');
    if (!modal) return;

    const titleEl = document.getElementById('warning-hazard-title');
    const riskBadge = document.getElementById('warning-risk-level');
    const leadTimeEl = document.getElementById('warning-lead-time');

    if (titleEl) titleEl.textContent = `${detail.hazard.toUpperCase()} RISK DETECTED`;
    if (riskBadge) riskBadge.textContent = 'CRITICAL / HIGH';
    if (leadTimeEl) leadTimeEl.textContent = 'SIMULATED: 4–5 DAYS (ESTIMATED LEAD TIME)';

    modal.classList.add('active');

    // Automatically trigger synthesized voice alert
    if (window.bhoomiAudio) {
      window.bhoomiAudio.speakVoiceAlert(detail.hazard, 'HIGH');
    }
  }

  showActionPlanReportModal() {
    const modal = document.getElementById('action-plan-modal');
    if (!modal || !window.bhoomiAfforest) return;

    const rep = window.bhoomiAfforest.generateActionPlanReport();

    this.setText('rep-id', rep.reportId);
    this.setText('rep-date', new Date(rep.generatedAt).toLocaleString());
    this.setText('rep-area', `${rep.totalAreaHa} Hectares`);
    this.setText('rep-canopy-diff', `${rep.currentCanopy}% ➔ ${rep.targetCanopy}%`);
    this.setText('rep-tree-count', `${rep.estimatedTreeCount.toLocaleString()} Saplings (Model Estimate)`);

    // Populate sample table
    const tableBody = document.getElementById('rep-table-body');
    if (tableBody) {
      tableBody.innerHTML = '';
      rep.pointsSample.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><b>${p.id}</b></td>
          <td>${p.lat.toFixed(5)}°N, ${p.lng.toFixed(5)}°E</td>
          <td>${p.shortZone}</td>
          <td>${p.species}</td>
          <td>${p.spacing}</td>
          <td><span class="metric-badge ${p.suitability === 'suitable' ? 'badge-low' : (p.suitability === 'moderate' ? 'badge-med' : 'badge-high')}">${p.suitability.toUpperCase()}</span></td>
        `;
        tableBody.appendChild(row);
      });
    }

    modal.classList.add('active');
  }

  downloadGPSCSV() {
    if (!window.bhoomiAfforest) return;
    const csvContent = window.bhoomiAfforest.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BHOOMI_GPS_Planting_Manifest_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  startTelemetryHeartbeat() {
    // Subtle real-time fluctuations to give living sensor feel
    this.telemetryInterval = setInterval(() => {
      if (window.bhoomiSim && !window.bhoomiSim.isPlaying && !window.bhoomiSim.currentHazard) {
        // Micro fluctuation in moisture & infiltration
        const deltaM = (Math.random() - 0.5) * 0.4;
        window.bhoomiSim.state.soilMoisture = Math.max(60, Math.min(75, window.bhoomiSim.state.soilMoisture + deltaM));
        this.setText('live-bhoomi-moisture', `${window.bhoomiSim.state.soilMoisture.toFixed(0)}%`);
      }
    }, 2500);
  }
}

// Global App Instance
window.bhoomiApp = new BhoomiApp();

// Boot on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.bhoomiApp.init();
});

// Dedicated Emergency Response page: kept separate from the Disaster Simulation workspace.
document.addEventListener('DOMContentLoaded', () => {
  const start = document.getElementById('btn-emergency-open-fire');
  if (!start) return;
  start.addEventListener('click', () => {
    window.bhoomiApp?.switchTab('simulation');
    setTimeout(() => document.getElementById('btn-sim-fire')?.click(), 120);
    setTimeout(() => window.bhoomiApp?.switchTab('emergency'), 260);
  });
});
