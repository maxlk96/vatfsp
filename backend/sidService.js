const fs = require('fs').promises;
const path = require('path');

class SIDService {
  constructor() {
    this.sids = [];
    this.loaded = false;
  }

  /**
   * Load SID data from file
   */
  async loadSIDs() {
    if (this.loaded) return;

    try {
      const sidPath = path.join(__dirname, '../data/SID.txt');
      const content = await fs.readFile(sidPath, 'utf-8');
      
      this.sids = content
        .split('\n')
        .filter(line => line.trim().startsWith('SID:'))
        .map(line => {
          const parts = line.split(':');
          if (parts.length >= 5) {
            return {
              airport: parts[1],
              runway: parts[2],
              name: parts[3],
              route: parts.slice(4).join(':').trim().split(/\s+/)
            };
          }
          return null;
        })
        .filter(sid => sid !== null);

      this.loaded = true;
      console.log(`Loaded ${this.sids.length} SIDs`);
    } catch (error) {
      console.error('Error loading SID data:', error);
      this.sids = [];
    }
  }

  /**
   * Find matching SID for a flight
   * @param {string} departure - Departure airport ICAO
   * @param {string} runway - Runway identifier (e.g., "03", "21")
   * @param {string} route - Flight plan route string
   * @returns {string|null} - SID name or null if no match
   */
  findSID(departure, runway, route) {
    if (!this.loaded) {
      console.warn('SID data not loaded');
      return null;
    }

    if (!departure || !route) return null;

    // Normalize runway (remove L/R/C if present for initial search)
    const runwayBase = runway.replace(/[LRC]$/i, '');
    
    // Split route into waypoints
    const routeWaypoints = route.toUpperCase().split(/\s+/).filter(w => w.length > 0);
    if (routeWaypoints.length === 0) return null;

    // Check if SID name is explicitly in the route
    const candidateSIDs = this.sids.filter(sid => 
      sid.airport === departure.toUpperCase() &&
      (sid.runway === runway || sid.runway === runwayBase)
    );

    // First check if SID name appears in route
    for (const sid of candidateSIDs) {
      if (route.toUpperCase().includes(sid.name.toUpperCase())) {
        return sid.name;
      }
    }

    // Then check if route starts with waypoints that match a SID's end
    for (const sid of candidateSIDs) {
      if (sid.route.length === 0) continue;
      
      // Get the last few waypoints of the SID route
      const sidEndWaypoints = sid.route.slice(-3); // Check last 3 waypoints
      
      // Check if any of these waypoints appear at the start of the route
      for (let i = 0; i < Math.min(sidEndWaypoints.length, routeWaypoints.length); i++) {
        if (sidEndWaypoints[sidEndWaypoints.length - 1 - i] === routeWaypoints[i]) {
          return sid.name;
        }
      }
    }

    return null;
  }

  /**
   * Get all runways for an airport
   * @param {string} icao - Airport ICAO code
   * @returns {string[]} - Array of runway identifiers
   */
  getRunways(icao) {
    if (!this.loaded) return [];
    
    const runways = new Set();
    this.sids
      .filter(sid => sid.airport === icao.toUpperCase())
      .forEach(sid => runways.add(sid.runway));
    
    return Array.from(runways).sort();
  }
}

module.exports = new SIDService();

