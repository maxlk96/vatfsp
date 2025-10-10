import axios from 'axios';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';

class ApiService {
  /**
   * Get flights for a specific airport
   */
  async getFlights(icao, runway = null) {
    const params = runway ? { runway } : {};
    const response = await axios.get(`${API_BASE}/api/flights/${icao}`, { params });
    return response.data;
  }

  /**
   * Print a flight strip
   */
  async printStrip(flightData) {
    const response = await axios.post(`${API_BASE}/api/print`, flightData);
    return response.data;
  }

  /**
   * Print a blank flight strip
   */
  async printBlank(type = 'departure') {
    const response = await axios.post(`${API_BASE}/api/print-blank`, { type });
    return response.data;
  }

  /**
   * Get printer status
   */
  async getPrinterStatus() {
    const response = await axios.get(`${API_BASE}/api/printer/status`);
    return response.data;
  }

  /**
   * Test printer
   */
  async testPrinter() {
    const response = await axios.post(`${API_BASE}/api/printer/test`);
    return response.data;
  }
}

export default new ApiService();


