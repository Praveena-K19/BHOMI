/**
 * BHOOMI-Net 2.0 - AI Afforestation & Ecological Restoration Engine
 * Calculates sapling population requirements, allocates 3 ecological zones,
 * matches native tree species, and applies tree placement exclusion rules.
 * All tree numbers and species matrices are model estimates for demonstration.
 */

class AfforestationEngine {
  constructor() {
    this.siteAreaHectares = 10.0; // 10 hectares (100,000 m²)
    this.centerCoords = { lat: 9.9265, lng: 78.1215 }; // Western Ghats representative coordinates

    // 3 Ecological Zones Definition
    this.zones = {
      waterfront: {
        name: "Zone 1 — Waterfront (Riparian Buffer)",
        shortName: "Waterfront",
        areaHa: 2.2,
        areaPercent: 22,
        targetCanopy: 72,
        recommendedSpacing: "3.5 m",
        saplingEstimate: 1450,
        primarySpecies: "Arjuna (Terminalia arjuna)",
        secondarySpecies: "Bamboo (Bambusa bambos), Native Riparian Reeds",
        purpose: "Riverbank stabilization, water velocity dissipation, sediment filtration and flood mitigation",
        conditions: ["Close to river channel", "High soil moisture (75-90%)", "Active scouring erosion risk"]
      },
      hillside: {
        name: "Zone 2 — Hillside (Slope Stabilization)",
        shortName: "Hillside",
        areaHa: 5.2,
        areaPercent: 52,
        targetCanopy: 68,
        recommendedSpacing: "4.5 m",
        saplingEstimate: 2400,
        primarySpecies: "Deep-Rooted Neem (Azadirachta indica) & Jamun (Syzygium cumini)",
        secondarySpecies: "Pongamia pinnata, Vetiver grass (Chrysopogon zizanioides) contour hedges",
        purpose: "Deep mechanical soil anchoring, reduction of pore water pressure, runoff reduction",
        conditions: ["High slope (24°–32°)", "Severe topsoil runoff shear", "LiDAR identified slip envelope"]
      },
      ridge: {
        name: "Zone 3 — Ridge / Forest Fringe (Fire Resilience)",
        shortName: "Ridge / Fringe",
        areaHa: 2.6,
        areaPercent: 26,
        targetCanopy: 62,
        recommendedSpacing: "5.5 m",
        saplingEstimate: 1000,
        primarySpecies: "Mahua (Madhuca longifolia) & Sal (Shorea robusta)",
        secondarySpecies: "Fire-resilient native broadleaf trees (Ficus benghalensis)",
        purpose: "Create living green firebreak, increase canopy continuity, retain moisture against wind",
        conditions: ["Exposed high-wind ridge", "Dry microclimate in summer", "Wildfire propagation corridor"]
      }
    };

    // Generate 65 high-resolution GPS planting points across the 3 zones
    this.plantingPoints = this.generateGPSPlantingGrid();
  }

  /**
   * Generates realistic GPS coordinates with ecological zoning and suitability flags
   */
  generateGPSPlantingGrid() {
    const points = [];
    let idCounter = 1;

    // Helper for adding offset to base lat/lng
    const addPt = (dLat, dLng, zoneKey, suitability, sp, spacing, priority, reason) => {
      const idStr = `PLANT-#${String(idCounter).padStart(3, '0')}`;
      idCounter++;
      points.push({
        id: idStr,
        lat: Number((this.centerCoords.lat + dLat).toFixed(6)),
        lng: Number((this.centerCoords.lng + dLng).toFixed(6)),
        zoneKey: zoneKey,
        zoneName: this.zones[zoneKey].name,
        shortZone: this.zones[zoneKey].shortName,
        suitability: suitability, // 'suitable' | 'moderate' | 'unsuitable'
        species: sp,
        spacing: spacing,
        priority: priority,
        reason: reason
      });
    };

    // 1. Waterfront Zone Points (Southern River Corridor, lower lat)
    const waterfrontCoords = [
      [-0.0035, -0.0032, 'suitable', 'Arjuna (Terminalia arjuna)', '3.5 m', 'HIGH', 'Direct riverbank scour mitigation'],
      [-0.0038, -0.0025, 'suitable', 'Arjuna (Terminalia arjuna)', '3.5 m', 'HIGH', 'Sediment trapping buffer zone'],
      [-0.0042, -0.0018, 'suitable', 'Bamboo (Bambusa bambos)', '3.0 m', 'HIGH', 'Dense rhizome riverbank anchoring'],
      [-0.0031, -0.0012, 'suitable', 'Arjuna (Terminalia arjuna)', '3.5 m', 'HIGH', 'Riparian corridor continuity'],
      [-0.0045, -0.0006, 'suitable', 'Riparian Willow / Reeds', '2.5 m', 'MEDIUM', 'Wetland edge soil binding'],
      [-0.0039,  0.0005, 'suitable', 'Arjuna (Terminalia arjuna)', '3.5 m', 'HIGH', 'Waterfront erosion buffer'],
      [-0.0048,  0.0012, 'suitable', 'Bamboo (Bambusa bambos)', '3.0 m', 'HIGH', 'Gully discharge dissipation'],
      [-0.0033,  0.0020, 'suitable', 'Arjuna (Terminalia arjuna)', '3.5 m', 'MEDIUM', 'Flood overflow bank buffer'],
      [-0.0044, -0.0022, 'moderate', 'Arjuna (Terminalia arjuna)', '4.0 m', 'MEDIUM', 'Seasonal submerged mudflat (mounding needed)'],
      [-0.0046, -0.0030, 'unsuitable', 'None (Exclusion Zone)', 'N/A', 'LOW', 'Active river deep-flow channel center'],
      [-0.0050,  0.0002, 'unsuitable', 'None (Exclusion Zone)', 'N/A', 'LOW', 'Perennial riverbed core corridor']
    ];

    waterfrontCoords.forEach(([dLat, dLng, suit, sp, spc, pri, rsn]) => {
      addPt(dLat, dLng, 'waterfront', suit, sp, spc, pri, rsn);
    });

    // 2. Hillside Zone Points (Central Slope 26.4°, mid lat)
    const hillsideCoords = [
      [-0.0015, -0.0028, 'suitable', 'Deep-Root Neem (Azadirachta indica)', '4.5 m', 'HIGH', 'Critical 26.4° slope shear stabilization'],
      [-0.0018, -0.0015, 'suitable', 'Vetiver (Chrysopogon zizanioides)', '1.5 m', 'HIGH', 'Contour runoff dispersion hedge'],
      [-0.0012, -0.0005, 'suitable', 'Jamun (Syzygium cumini)', '4.5 m', 'HIGH', 'Pore pressure mitigation on upper slip terrace'],
      [-0.0022,  0.0002, 'suitable', 'Pongamia pinnata', '4.0 m', 'HIGH', 'Nitrogen-fixing root anchor in bare soil'],
      [-0.0008,  0.0010, 'suitable', 'Deep-Root Neem (Azadirachta indica)', '4.5 m', 'HIGH', 'Gully headcut stabilization'],
      [-0.0019,  0.0018, 'suitable', 'Vetiver (Chrysopogon zizanioides)', '1.5 m', 'HIGH', 'Erosion channel interceptor'],
      [-0.0025,  0.0025, 'suitable', 'Jamun (Syzygium cumini)', '4.5 m', 'MEDIUM', 'Contour tree belt'],
      [-0.0005, -0.0020, 'suitable', 'Deep-Root Neem (Azadirachta indica)', '4.5 m', 'HIGH', 'Bare soil terrace reforestation'],
      [-0.0010, -0.0035, 'suitable', 'Pongamia pinnata', '4.0 m', 'MEDIUM', 'West face topsoil retention'],
      [-0.0028, -0.0010, 'suitable', 'Deep-Root Neem (Azadirachta indica)', '4.5 m', 'HIGH', 'Slope anchor node #18'],
      [-0.0016,  0.0032, 'suitable', 'Vetiver (Chrysopogon zizanioides)', '1.5 m', 'MEDIUM', 'Runoff velocity decelerator'],
      [-0.0002, -0.0010, 'suitable', 'Jamun (Syzygium cumini)', '4.5 m', 'HIGH', 'Upper gully stabilization'],
      [-0.0020, -0.0022, 'moderate', 'Deep-Root Neem (Azadirachta indica)', '5.0 m', 'MEDIUM', 'Rocky substrate (contour trench required)'],
      [-0.0014,  0.0008, 'moderate', 'Pongamia pinnata', '4.5 m', 'MEDIUM', 'Compacted subsoil (pit conditioning required)'],
      [-0.0007,  0.0022, 'moderate', 'Vetiver (Chrysopogon zizanioides)', '1.5 m', 'MEDIUM', 'High gravel content terrace'],
      [-0.0011, -0.0001, 'unsuitable', 'None (Exclusion Zone)', 'N/A', 'LOW', 'Active gravel access road corridor'],
      [-0.0024, -0.0032, 'unsuitable', 'None (Exclusion Zone)', 'N/A', 'LOW', 'Existing mature teak canopy overlap'],
      [-0.0004, -0.0032, 'unsuitable', 'None (Exclusion Zone)', 'N/A', 'LOW', 'Sheer vertical rock cliff (>50° slope)']
    ];

    hillsideCoords.forEach(([dLat, dLng, suit, sp, spc, pri, rsn]) => {
      addPt(dLat, dLng, 'hillside', suit, sp, spc, pri, rsn);
    });

    // 3. Ridge / Forest Fringe Zone Points (Northern High Ground, higher lat)
    const ridgeCoords = [
      [ 0.0012, -0.0025, 'suitable', 'Mahua (Madhuca longifolia)', '5.5 m', 'HIGH', 'Living green firebreak buffer'],
      [ 0.0018, -0.0018, 'suitable', 'Sal (Shorea robusta)', '5.5 m', 'HIGH', 'Foliar moisture retention against wildfire'],
      [ 0.0024, -0.0008, 'suitable', 'Ficus benghalensis', '6.0 m', 'MEDIUM', 'Broadleaf thermal radiation shield'],
      [ 0.0015,  0.0005, 'suitable', 'Mahua (Madhuca longifolia)', '5.5 m', 'HIGH', 'Ridge windbreak corridor'],
      [ 0.0022,  0.0014, 'suitable', 'Sal (Shorea robusta)', '5.5 m', 'HIGH', 'Forest perimeter reinforcement'],
      [ 0.0028,  0.0022, 'suitable', 'Mahua (Madhuca longifolia)', '5.5 m', 'MEDIUM', 'Upper ridge continuity'],
      [ 0.0008,  0.0018, 'suitable', 'Ficus benghalensis', '6.0 m', 'MEDIUM', 'Boundary moisture barrier'],
      [ 0.0016, -0.0034, 'suitable', 'Sal (Shorea robusta)', '5.5 m', 'MEDIUM', 'Northwest crest firebreak'],
      [ 0.0026, -0.0022, 'moderate', 'Mahua (Madhuca longifolia)', '6.0 m', 'MEDIUM', 'Exposed shallow ridge bedrock (requires sapling pit prep)'],
      [ 0.0030,  0.0002, 'moderate', 'Sal (Shorea robusta)', '5.5 m', 'MEDIUM', 'Wind-shear exposure peak'],
      [ 0.0020, -0.0002, 'unsuitable', 'None (Exclusion Zone)', 'N/A', 'LOW', 'Telemetry tower & LoRa gateway clearing'],
      [ 0.0032, -0.0014, 'unsuitable', 'None (Exclusion Zone)', 'N/A', 'LOW', 'Existing old-growth forest reserve core']
    ];

    ridgeCoords.forEach(([dLat, dLng, suit, sp, spc, pri, rsn]) => {
      addPt(dLat, dLng, 'ridge', suit, sp, spc, pri, rsn);
    });

    return points;
  }

  /**
   * Generates complete Ecological Action Plan Report Data
   */
  generateActionPlanReport() {
    const totalSaplings = 
      this.zones.waterfront.saplingEstimate + 
      this.zones.hillside.saplingEstimate + 
      this.zones.ridge.saplingEstimate;

    const suitableCount = this.plantingPoints.filter(p => p.suitability === 'suitable').length;
    const moderateCount = this.plantingPoints.filter(p => p.suitability === 'moderate').length;
    const unsuitableCount = this.plantingPoints.filter(p => p.suitability === 'unsuitable').length;

    return {
      reportId: `BHOOMI-REP-${Date.now().toString().slice(-6)}`,
      generatedAt: new Date().toISOString(),
      siteName: "Sector 7-B Catchment Basin (Simulated Landscape)",
      totalAreaHa: this.siteAreaHectares,
      currentCanopy: 24.2,
      targetCanopy: 68.5,
      currentBareSoil: 75.8,
      targetBareSoil: 31.5,
      estimatedTreeCount: totalSaplings,
      zones: this.zones,
      gpsSummary: {
        totalGridPoints: this.plantingPoints.length,
        suitablePoints: suitableCount,
        moderatePoints: moderateCount,
        unsuitablePoints: unsuitableCount
      },
      pointsSample: this.plantingPoints.slice(0, 15)
    };
  }

  /**
   * Generates downloadable CSV content of GPS planting points
   */
  generateCSV() {
    let csv = "Plant_ID,Latitude,Longitude,Zone,Suitability,Recommended_Species,Spacing,Priority,Ecological_Reason\n";
    this.plantingPoints.forEach(p => {
      csv += `"${p.id}",${p.lat},${p.lng},"${p.shortZone}","${p.suitability}","${p.species}","${p.spacing}","${p.priority}","${p.reason.replace(/"/g, '""')}"\n`;
    });
    return csv;
  }
}

window.bhoomiAfforest = new AfforestationEngine();
