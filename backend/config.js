module.exports = {
  // Default airport ICAO code
  defaultAirport: 'ESGG',
  
  // VATSIM data feed URL
  vatsimDataUrl: 'https://data.vatsim.net/v3/vatsim-data.json',
  
  // Server configuration
  port: process.env.PORT || 3000,
  
  // Printer settings
  printer: {
    // Paper width in pixels for 58mm thermal printer (8 dots/mm)
    paperWidthPixels: 384,
    
    // DPI for rendering
    dpi: 203,
    
    // USB vendor and product IDs (common for POS-5890K)
    // May need adjustment based on specific printer
    vendorId: null, // Auto-detect
    productId: null  // Auto-detect
  },
  
  // Data refresh interval (milliseconds)
  refreshInterval: 15000
};


