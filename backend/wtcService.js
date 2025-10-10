const fs = require('fs').promises;
const path = require('path');

class WTCService {
  constructor() {
    this.wtcData = new Map(); // Map of ICAO type code -> WTC
    this.initialized = false;
  }

  /**
   * Initialize and load WTC data from ICAO_Aircraft.txt
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const filePath = path.join(__dirname, '../data/ICAO_Aircraft.txt');
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      const lines = fileContent.split('\n');
      let count = 0;

      for (const line of lines) {
        // Skip comments and empty lines
        if (line.startsWith(';') || line.trim() === '') continue;

        // Parse line: ICAO_CODE	WTCE_INFO	MANUFACTURER	MODEL
        const parts = line.split('\t');
        if (parts.length >= 2) {
          const icaoCode = parts[0].trim().toUpperCase();
          const wtcInfo = parts[1].trim();
          
          // WTC is the first character of the second column
          // Format: WTCE (e.g., ML2J where M is WTC)
          if (wtcInfo.length > 0) {
            const wtc = wtcInfo[0]; // First character is WTC
            this.wtcData.set(icaoCode, wtc);
            count++;
          }
        }
      }

      this.initialized = true;
      console.log(`Loaded ${count} aircraft WTC entries`);
    } catch (error) {
      console.error('Error loading WTC data:', error);
      this.initialized = true; // Mark as initialized to prevent repeated attempts
    }
  }

  /**
   * Get WTC for an aircraft ICAO type code
   * @param {string} icaoType - Aircraft ICAO type code (e.g., 'A320', 'B738')
   * @returns {string} - WTC category (L, M, H, J) or empty string if not found
   */
  getWTC(icaoType) {
    if (!icaoType) return '';
    
    const type = icaoType.toUpperCase().trim();
    return this.wtcData.get(type) || '';
  }

  /**
   * Get full WTC description
   * @param {string} wtc - WTC letter
   * @returns {string} - Full description
   */
  getWTCDescription(wtc) {
    const descriptions = {
      'L': 'Light',
      'M': 'Medium',
      'H': 'Heavy',
      'J': 'Super (A380)'
    };
    return descriptions[wtc] || '';
  }
}

module.exports = new WTCService();

