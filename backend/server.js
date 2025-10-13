const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const vatsimClient = require('./vatsim');
const printer = require('./printer');
const stripRenderer = require('./stripRenderer');
const wtcService = require('./wtcService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

/**
 * Get flights for a specific airport
 */
app.get('/api/flights/:icao', async (req, res) => {
  try {
    const icao = req.params.icao.toUpperCase();
    const runway = req.query.runway || null;
    const flights = await vatsimClient.getFlightsForAirport(icao, runway);
    res.json(flights);
  } catch (error) {
    console.error('Error fetching flights:', error);
    res.status(500).json({ error: 'Failed to fetch flight data' });
  }
});

/**
 * Print a flight strip
 */
app.post('/api/print', async (req, res) => {
  try {
    const flightData = req.body;
    
    if (!flightData || !flightData.callsign) {
      return res.status(400).json({ error: 'Invalid flight data' });
    }

    console.log('Print request for:', flightData.callsign);

    // Render flight strip to image
    const imageBuffer = await stripRenderer.renderStrip(flightData);
    
    // Print the image
    await printer.printImage(imageBuffer);
    
    res.json({ 
      success: true, 
      message: `Flight strip for ${flightData.callsign} printed successfully` 
    });
  } catch (error) {
    console.error('Error printing flight strip:', error);
    
    // Try fallback text printing
    try {
      await printer.printText(req.body);
      res.json({ 
        success: true, 
        message: 'Printed using text fallback',
        warning: 'Image printing failed, used text mode'
      });
    } catch (fallbackError) {
      res.status(500).json({ 
        error: 'Failed to print flight strip',
        details: error.message 
      });
    }
  }
});

/**
 * Print a flight strip from external sources (e.g., VatIRIS)
 * This endpoint accepts flexible field names and aliases for compatibility
 * If no callsign is provided, prints a blank strip
 */
app.post('/api/print/external', async (req, res) => {
  try {
    const requestData = req.body || {};
    
    // If no callsign provided, print blank strip
    const isBlankStrip = !requestData.callsign;
    
    // Get aircraft type
    const aircraftType = requestData.aircraft || requestData.aircraftType || '';
    
    // Auto-populate WTC from aircraft type if not provided
    let wtc = requestData.wtc || requestData.wakeTurbulence || '';
    if (!wtc && aircraftType) {
      await wtcService.initialize();
      wtc = wtcService.getWTC(aircraftType);
    }
    
    // Get transponder/squawk - treat "0000" as no squawk assigned
    let transponder = requestData.transponder || requestData.squawk || '';
    if (transponder === '0000') {
      transponder = ''; // 0000 means no squawk assigned yet
    }
    
    // Map field aliases to standard field names
    const flightData = {
      callsign: requestData.callsign || '',
      type: requestData.type || 'departure',
      flightRules: requestData.flightRules || requestData.flightType || '',
      aircraft: aircraftType,
      wtc: wtc,
      transponder: transponder,
      sid: requestData.sid || '',
      departure: requestData.departure || requestData.origin || '',
      arrival: requestData.arrival || requestData.destination || '',
      route: requestData.route || '',
      rfl: requestData.rfl || requestData.cruiseAltitude || requestData.altitude || '',
      eobt: requestData.eobt || requestData.departureTime || '',
      tas: requestData.tas || requestData.speed || '',
      eta: requestData.eta || requestData.estimatedArrival || ''
    };

    if (isBlankStrip) {
      console.log('External blank strip request from VatIRIS/external');
    } else {
      console.log('External print request for:', flightData.callsign, 'from VatIRIS/external');
    }

    // Render flight strip to image
    const imageBuffer = await stripRenderer.renderStrip(flightData);
    
    // Print the image
    await printer.printImage(imageBuffer);
    
    res.json({ 
      success: true, 
      message: isBlankStrip 
        ? 'Blank flight strip printed successfully'
        : `Flight strip for ${flightData.callsign} printed successfully`,
      callsign: flightData.callsign || null,
      type: flightData.type,
      blank: isBlankStrip
    });
  } catch (error) {
    console.error('Error printing external flight strip:', error);
    
    // Try fallback text printing
    try {
      // Get aircraft type
      const fallbackAircraftType = req.body?.aircraft || req.body?.aircraftType || '';
      
      // Auto-populate WTC from aircraft type if not provided
      let fallbackWtc = req.body?.wtc || req.body?.wakeTurbulence || '';
      if (!fallbackWtc && fallbackAircraftType) {
        await wtcService.initialize();
        fallbackWtc = wtcService.getWTC(fallbackAircraftType);
      }
      
      // Get transponder/squawk - treat "0000" as no squawk assigned
      let fallbackTransponder = req.body?.transponder || req.body?.squawk || '';
      if (fallbackTransponder === '0000') {
        fallbackTransponder = ''; // 0000 means no squawk assigned yet
      }
      
      const flightData = {
        callsign: req.body?.callsign || '',
        type: req.body?.type || 'departure',
        flightRules: req.body?.flightRules || req.body?.flightType || '',
        aircraft: fallbackAircraftType,
        wtc: fallbackWtc,
        transponder: fallbackTransponder,
        sid: req.body?.sid || '',
        departure: req.body?.departure || req.body?.origin || '',
        arrival: req.body?.arrival || req.body?.destination || '',
        route: req.body?.route || '',
        rfl: req.body?.rfl || req.body?.cruiseAltitude || req.body?.altitude || '',
        eobt: req.body?.eobt || req.body?.departureTime || '',
        tas: req.body?.tas || req.body?.speed || '',
        eta: req.body?.eta || req.body?.estimatedArrival || ''
      };
      
      await printer.printText(flightData);
      res.json({ 
        success: true, 
        message: 'Printed using text fallback',
        warning: 'Image printing failed, used text mode',
        callsign: flightData.callsign || null
      });
    } catch (fallbackError) {
      res.status(500).json({ 
        error: 'Failed to print flight strip',
        details: error.message,
        callsign: req.body?.callsign || null
      });
    }
  }
});

/**
 * Print a blank flight strip
 */
app.post('/api/print-blank', async (req, res) => {
  try {
    console.log('Printing blank strip');

    // Create empty flight data
    const blankData = {
      callsign: '',
      flightRules: '',
      aircraft: '',
      transponder: '',
      sid: '',
      departure: '',
      arrival: '',
      route: '',
      rfl: '',
      type: req.body.type || 'departure'
    };

    // Render flight strip to image
    const imageBuffer = await stripRenderer.renderStrip(blankData);
    
    // Print the image
    await printer.printImage(imageBuffer);
    
    res.json({ 
      success: true, 
      message: 'Blank flight strip printed successfully' 
    });
  } catch (error) {
    console.error('Error printing blank strip:', error);
    
    // Try fallback text printing
    try {
      await printer.printText(blankData);
      res.json({ 
        success: true, 
        message: 'Blank strip printed using text fallback',
        warning: 'Image printing failed, used text mode'
      });
    } catch (fallbackError) {
      res.status(500).json({ 
        error: 'Failed to print blank strip',
        details: error.message 
      });
    }
  }
});

/**
 * Get printer status
 */
app.get('/api/printer/status', (req, res) => {
  const status = printer.getStatus();
  res.json(status);
});

/**
 * Test printer connection
 */
app.post('/api/printer/test', async (req, res) => {
  try {
    await printer.testPrint();
    res.json({ success: true, message: 'Test print completed' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Test print failed', 
      details: error.message 
    });
  }
});

// Serve Vue app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Start server
app.listen(config.port, () => {
  console.log(`VATSIM Flight Strip Printer server running on port ${config.port}`);
  console.log(`Default airport: ${config.defaultAirport}`);
  
  // Try to connect to printer on startup
  setTimeout(() => {
    printer.connect();
  }, 1000);
});

