const axios = require('axios');
const config = require('./config');
const sidService = require('./sidService');
const wtcService = require('./wtcService');

class VatsimClient {
  constructor() {
    this.cachedData = null;
    this.lastFetch = null;
    this.initialized = false;
  }

  /**
   * Initialize the client (load SID and WTC data)
   */
  async initialize() {
    if (!this.initialized) {
      await sidService.loadSIDs();
      await wtcService.initialize();
      this.initialized = true;
    }
  }

  /**
   * Fetch latest VATSIM data
   */
  async fetchData() {
    try {
      const response = await axios.get(config.vatsimDataUrl, {
        timeout: 10000
      });
      this.cachedData = response.data;
      this.lastFetch = new Date();
      return this.cachedData;
    } catch (error) {
      console.error('Error fetching VATSIM data:', error.message);
      throw error;
    }
  }

  /**
   * Get flights for a specific airport (arrivals and departures)
   * @param {string} icao - Airport ICAO code
   * @param {string} runway - Optional runway filter
   */
  async getFlightsForAirport(icao, runway = null) {
    await this.initialize();
    const data = await this.fetchData();
    
    if (!data || !data.pilots) {
      return { arrivals: [], departures: [], runways: [] };
    }

    const icaoUpper = icao.toUpperCase();
    const arrivals = [];
    const departures = [];

    data.pilots.forEach(pilot => {
      const flightPlan = pilot.flight_plan;
      
      // Skip pilots without flight plans
      if (!flightPlan) return;

      const departure = flightPlan.departure || '';
      const arrival = flightPlan.arrival || '';
      const route = flightPlan.route || '';
      const remarks = flightPlan.remarks || '';

      // Determine flight rules (FRUL)
      const flightRules = this.determineFlightRules(
        flightPlan.flight_rules || 'I',
        route,
        remarks
      );

      // Get WTC from aircraft type
      const aircraftType = flightPlan.aircraft_short || flightPlan.aircraft || '';
      const wtc = wtcService.getWTC(aircraftType);

      // Create flight strip data object
      const flightData = {
        callsign: pilot.callsign,
        cid: pilot.cid,
        name: pilot.name,
        departure: departure,
        arrival: arrival,
        aircraft: aircraftType || 'ZZZZ',
        wtc: wtc, // Wake Turbulence Category
        altitude: flightPlan.altitude || 'N/A',
        cruiseAltitude: flightPlan.altitude || 'N/A',
        rfl: this.formatRFL(flightPlan.altitude), // Formatted altitude for strip
        route: route,
        remarks: remarks,
        filedTime: flightPlan.deptime || '',
        eobt: flightPlan.deptime || '', // EOBT (Estimated Off-Block Time)
        tas: this.formatTAS(flightPlan.cruise_tas), // TAS (True Air Speed) in ICAO format
        actualTime: this.calculateActualTime(pilot),
        groundspeed: pilot.groundspeed,
        heading: pilot.heading,
        latitude: pilot.latitude,
        longitude: pilot.longitude,
        transponder: pilot.transponder,
        flightRules: flightRules,
        server: pilot.server,
        logonTime: pilot.logon_time,
        lastUpdated: pilot.last_updated
      };

      // Check if departure matches
      if (departure === icaoUpper) {
        // Try to find SID
        const sid = runway ? sidService.findSID(departure, runway, route) : null;
        departures.push({ 
          ...flightData, 
          type: 'departure',
          sid: sid || ''
        });
      }

      // Check if arrival matches
      if (arrival === icaoUpper) {
        arrivals.push({ ...flightData, type: 'arrival' });
      }
    });

    // Get available runways for this airport
    const runways = sidService.getRunways(icaoUpper);

    return {
      arrivals: arrivals.sort((a, b) => a.callsign.localeCompare(b.callsign)),
      departures: departures.sort((a, b) => a.callsign.localeCompare(b.callsign)),
      updateTime: this.lastFetch,
      runways: runways
    };
  }

  /**
   * Determine flight rules with special cases
   * @param {string} rules - Filed flight rules (I/V/Y/Z)
   * @param {string} route - Route string
   * @param {string} remarks - Remarks string
   * @returns {string} - Flight rule letter (I/V/Y/Z)
   */
  determineFlightRules(rules, route, remarks) {
    const upperRoute = (route + ' ' + remarks).toUpperCase();
    const baseRule = rules.toUpperCase();

    // Y = IFR with VFR mentioned in route
    if ((baseRule === 'I' || baseRule === 'Y') && upperRoute.includes('VFR')) {
      return 'Y';
    }

    // Z = VFR with IFR mentioned in route  
    if ((baseRule === 'V' || baseRule === 'Z') && upperRoute.includes('IFR')) {
      return 'Z';
    }

    // Default to base rule or I
    return baseRule === 'V' ? 'V' : 'I';
  }

  /**
   * Format altitude for flight strip (RFL field)
   * @param {string} altitude - Altitude string from flight plan
   * @returns {string} - Formatted altitude (F360, A50, etc.)
   */
  formatRFL(altitude) {
    if (!altitude || altitude === 'N/A') return '';
    
    // Remove any non-numeric characters except leading zeros
    const numAlt = parseInt(altitude.toString().replace(/\D/g, ''));
    
    if (isNaN(numAlt)) return '';

    // Above 5000ft: show in flight levels (divide by 100, prefix with F)
    if (numAlt > 5000) {
      const flightLevel = Math.floor(numAlt / 100);
      return `F${flightLevel}`;
    } else {
      // 5000ft or below: show with A prefix (in hundreds)
      const altHundreds = Math.floor(numAlt / 100);
      return `A${altHundreds}`;
    }
  }

  /**
   * Format TAS (True Air Speed) in ICAO format
   * Example: 450 -> N0450
   */
  formatTAS(speed) {
    if (!speed) return '';
    
    // Extract numeric value
    const numSpeed = parseInt(speed.toString().replace(/\D/g, ''));
    
    if (isNaN(numSpeed)) return '';
    
    // Format as N0XXX (ICAO format: N + 4 digits with leading zeros)
    return `N${numSpeed.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate estimated actual time based on current position
   */
  calculateActualTime(pilot) {
    const logonTime = new Date(pilot.logon_time);
    const now = new Date();
    const minutesSinceLogon = Math.floor((now - logonTime) / 60000);
    return `${Math.floor(minutesSinceLogon / 60)}h ${minutesSinceLogon % 60}m`;
  }
}

module.exports = new VatsimClient();


