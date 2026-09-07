/**
 * BHOOMI-Net 2.0 - Telemetry Analytics Engine (Chart.js)
 * Renders 6 animated environmental data charts:
 * 1. Rainfall vs Runoff (Hydrograph Pre vs Post Afforestation)
 * 2. Soil Moisture vs Landslide Risk Correlation
 * 3. Canopy Coverage vs Runoff Mitigation
 * 4. NDVI vs Vegetation Health Distribution
 * 5. Multi-Hazard Temporal Risk Timeline (24h Window)
 * 6. Sapling Growth & Canopy Expansion Projection (5 Years)
 */

class AnalyticsEngine {
  constructor() {
    this.charts = {};
    this.initialized = false;
  }

  init() {
    if (typeof Chart === 'undefined') {
      console.warn("Chart.js not loaded yet. Retrying...");
      setTimeout(() => this.init(), 250);
      return;
    }

    // Set Chart.js Dark Mode Defaults
    Chart.defaults.color = '#8b9bb4';
    Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(10, 16, 28, 0.92)';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(0, 240, 152, 0.4)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 6;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;

    this.renderRainfallRunoffChart();
    this.renderSoilMoistureSlideChart();
    this.renderCanopyRunoffChart();
    this.renderNDVIHealthChart();
    this.renderTemporalRiskChart();
    this.renderPlantingGrowthChart();

    this.initialized = true;
  }

  renderRainfallRunoffChart() {
    const ctx = document.getElementById('chart-rainfall-runoff');
    if (!ctx) return;

    this.charts.rainfallRunoff = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['0h', '2h', '4h', '6h (Peak Rain)', '8h', '10h', '12h', '14h', '16h'],
        datasets: [
          {
            label: 'Rainfall Inflow (mm/hr)',
            data: [15, 35, 75, 120, 95, 60, 35, 20, 10],
            borderColor: '#00e5ff',
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2
          },
          {
            label: 'Pre-Afforestation Runoff (24% Canopy)',
            data: [5, 28, 68, 114, 88, 52, 28, 16, 8],
            borderColor: '#ff3366',
            borderDash: [5, 5],
            tension: 0.35,
            borderWidth: 2
          },
          {
            label: 'Post-Afforestation Runoff (68% Canopy)',
            data: [2, 12, 32, 54, 46, 30, 18, 10, 4],
            borderColor: '#00f098',
            backgroundColor: 'rgba(0, 240, 152, 0.12)',
            fill: true,
            tension: 0.4,
            borderWidth: 2.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
          y: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: { display: true, text: 'Discharge Volume (m³/s)', color: '#8b9bb4' }
          }
        }
      }
    });
  }

  renderSoilMoistureSlideChart() {
    const ctx = document.getElementById('chart-soil-slide');
    if (!ctx) return;

    this.charts.soilSlide = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['40%', '50%', '60%', '70%', '80%', '85%', '90%', '95%', '100%'],
        datasets: [
          {
            label: 'Landslide Probability Index',
            data: [8, 12, 18, 26, 42, 58, 76, 89, 96],
            borderColor: '#ff9100',
            backgroundColor: 'rgba(255, 145, 0, 0.15)',
            fill: true,
            tension: 0.4,
            borderWidth: 2.5
          },
          {
            label: 'Factor of Safety (FoS × 50)',
            data: [90, 85, 78, 68, 55, 46, 36, 28, 22],
            borderColor: '#a855f7',
            borderDash: [4, 4],
            tension: 0.3,
            borderWidth: 1.8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: { display: true, text: 'Soil Moisture Saturation (%)', color: '#8b9bb4' }
          },
          y: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: { display: true, text: 'Risk Score / FoS Scale', color: '#8b9bb4' }
          }
        }
      }
    });
  }

  renderCanopyRunoffChart() {
    const ctx = document.getElementById('chart-canopy-runoff');
    if (!ctx) return;

    this.charts.canopyRunoff = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['15%', '24% (Current)', '35%', '45%', '55%', '68% (Target)', '80%'],
        datasets: [
          {
            label: 'Overland Runoff Coefficient (%)',
            data: [88, 78, 64, 48, 36, 24, 16],
            borderColor: '#2979ff',
            backgroundColor: 'rgba(41, 121, 255, 0.15)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5
          },
          {
            label: 'Soil Infiltration Recovery (%)',
            data: [20, 28, 42, 58, 72, 86, 94],
            borderColor: '#00f098',
            tension: 0.35,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: { display: true, text: 'Canopy Coverage (%)', color: '#8b9bb4' }
          },
          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
        }
      }
    });
  }

  renderNDVIHealthChart() {
    const ctx = document.getElementById('chart-ndvi-health');
    if (!ctx) return;

    this.charts.ndviHealth = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['0.10 - 0.25 (Critical Stress)', '0.26 - 0.40 (Drought Stress)', '0.41 - 0.60 (Moderate)', '0.61 - 0.75 (Healthy Canopy)', '0.76+ (Lush Forest)'],
        datasets: [
          {
            label: 'Area Allocation (Hectares)',
            data: [2.1, 4.2, 2.3, 1.1, 0.3],
            backgroundColor: [
              'rgba(255, 51, 102, 0.65)',
              'rgba(255, 179, 0, 0.65)',
              'rgba(0, 229, 255, 0.65)',
              'rgba(0, 240, 152, 0.65)',
              'rgba(46, 125, 50, 0.8)'
            ],
            borderColor: [
              '#ff3366',
              '#ffb300',
              '#00e5ff',
              '#00f098',
              '#4caf50'
            ],
            borderWidth: 1.5,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
          y: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: { display: true, text: 'Hectares (Total: 10 ha)', color: '#8b9bb4' }
          }
        }
      }
    });
  }

  renderTemporalRiskChart() {
    const ctx = document.getElementById('chart-temporal-risk');
    if (!ctx) return;

    this.charts.temporalRisk = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '24:00'],
        datasets: [
          {
            label: 'Flash Flood Risk %',
            data: [18, 19, 24, 38, 55, 74, 86, 82, 68],
            borderColor: '#2979ff',
            tension: 0.4,
            borderWidth: 2
          },
          {
            label: 'Wildfire Risk %',
            data: [12, 10, 14, 28, 44, 58, 46, 32, 22],
            borderColor: '#ffb300',
            tension: 0.4,
            borderWidth: 2
          },
          {
            label: 'Landslide Risk %',
            data: [23, 23, 26, 35, 50, 68, 88, 91, 84],
            borderColor: '#ff3366',
            tension: 0.4,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
          y: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            min: 0,
            max: 100,
            title: { display: true, text: 'Hazard Probability (%)', color: '#8b9bb4' }
          }
        }
      }
    });
  }

  renderPlantingGrowthChart() {
    const ctx = document.getElementById('chart-planting-growth');
    if (!ctx) return;

    this.charts.plantingGrowth = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Baseline (Year 0)', 'Year 1 (Sapling)', 'Year 2 (Establishment)', 'Year 3 (Canopy Closure)', 'Year 4 (Root Anchor)', 'Year 5 (Mature System)'],
        datasets: [
          {
            type: 'line',
            label: 'Estimated Canopy Coverage %',
            data: [24.2, 32.5, 44.0, 56.8, 64.2, 68.5],
            borderColor: '#00f098',
            borderWidth: 3,
            tension: 0.35,
            yAxisID: 'y'
          },
          {
            type: 'bar',
            label: 'Survival Count (Saplings)',
            data: [0, 4480, 4210, 4050, 3960, 3920],
            backgroundColor: 'rgba(0, 229, 255, 0.35)',
            borderColor: '#00e5ff',
            borderWidth: 1.5,
            borderRadius: 4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
          y: {
            position: 'left',
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: { display: true, text: 'Canopy Coverage (%)', color: '#00f098' },
            min: 0,
            max: 100
          },
          y1: {
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Active Tree Count', color: '#00e5ff' },
            min: 0,
            max: 5500
          }
        }
      }
    });
  }

  resizeAll() {
    Object.values(this.charts).forEach(c => {
      if (c && typeof c.resize === 'function') c.resize();
    });
  }
}

window.bhoomiAnalytics = new AnalyticsEngine();
