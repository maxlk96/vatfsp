# VatIRIS Flight Strip Printer Integration API

## Overview
This document describes the API endpoint for integrating external ATC software (like VatIRIS) with the VATSIM Flight Strip Printer (FSP) system. The API allows any software to send flight data and trigger physical thermal printer output.

## API Endpoint

**Endpoint:** `POST /api/print/external`  
**Base URL:** `http://localhost:3000` (default, configurable)  
**Content-Type:** `application/json`

## Authentication
Currently, no authentication is required. The API is designed for local network use.

## Request Format

### Blank Strips
To print a blank strip, send an empty request body `{}` or omit the `callsign` field. You can optionally specify `type` to control whether it's a departure or arrival blank strip (defaults to "departure").

### Optional Fields
All fields are optional. If `callsign` is omitted, a blank strip will be printed:

| Field Name | Aliases | Type | Description | Example |
|------------|---------|------|-------------|---------|
| `callsign` | - | string | Aircraft callsign (omit for blank strip) | `"SAS123"` |
| `type` | - | string | Strip type: "departure" or "arrival" | `"departure"` |
| `flightRules` | `flightType` | string | Flight rules: "I" (IFR), "V" (VFR), "Y" (IFR changing to VFR), or "Z" (VFR changing to IFR) | `"I"` |
| `aircraft` | `aircraftType` | string | Aircraft type ICAO code (auto-fills WTC if omitted) | `"A320"` |
| `wtc` | `wakeTurbulence` | string | Wake turbulence category: "L", "M", "H", "J" | `"M"` |
| `transponder` | `squawk` | string | Assigned squawk code ("0000" = no squawk) | `"2301"` |
| `sid` | - | string | Standard Instrument Departure (departures only) | `"VAMM1A"` |
| `departure` | `origin` | string | Departure airport ICAO | `"ESGG"` |
| `arrival` | `destination` | string | Arrival airport ICAO | `"ESSA"` |
| `route` | - | string | Filed flight route | `"DCT XAMEL M609 NILUG"` |
| `rfl` | `cruiseAltitude`, `altitude` | string | Requested Flight Level | `"FL370"` or `"37000"` |
| `eobt` | `departureTime` | string | Estimated Off-Block Time | `"1430"` |
| `eta` | `estimatedArrival` | string | Estimated Time of Arrival (arrivals only) | `"1545"` |
| `tas` | `speed` | string | True Airspeed | `"450"` |

### Field Aliases
The API accepts multiple field names for compatibility with different systems. For example:
- `departure`, `origin` → both map to departure airport
- `arrival`, `destination` → both map to arrival airport
- `transponder`, `squawk` → both map to squawk code
- `rfl`, `cruiseAltitude`, `altitude` → all map to flight level
- `eta`, `estimatedArrival` → both map to estimated arrival time
- `eobt`, `departureTime` → both map to estimated off-block time
- `tas`, `speed` → both map to true airspeed
- `flightRules`, `flightType` → both map to flight rules

### Special Field Handling

**Wake Turbulence Category (WTC)**  
If `wtc` is not provided but `aircraft` is, the system automatically looks up the WTC from the ICAO aircraft database based on the aircraft type code.

**Squawk Code (Transponder)**  
The squawk code `"0000"` is treated as "no squawk assigned" and will print as blank on the strip. This is the standard aviation convention where `0000` indicates that ATC has not yet assigned a squawk code.

## Example Requests

### Blank Strip (Default Departure)
```json
POST /api/print/external
Content-Type: application/json

{}
```

### Blank Arrival Strip
```json
POST /api/print/external
Content-Type: application/json

{
  "type": "arrival"
}
```

### Minimal Request
```json
POST /api/print/external
Content-Type: application/json

{
  "callsign": "SAS123"
}
```

### Complete Departure Strip
```json
POST /api/print/external
Content-Type: application/json

{
  "callsign": "SAS123",
  "type": "departure",
  "flightRules": "I",
  "aircraft": "A320",
  "wtc": "M",
  "transponder": "2301",
  "sid": "VAMM1A",
  "departure": "ESGG",
  "arrival": "ESSA",
  "route": "VAMM DCT XAMEL M609 NILUG DCT GUSAP",
  "rfl": "FL370",
  "eobt": "1430",
  "tas": "450"
}
```

### Complete Arrival Strip
```json
POST /api/print/external
Content-Type: application/json

{
  "callsign": "DAL456",
  "type": "arrival",
  "flightRules": "I",
  "aircraft": "B738",
  "wtc": "M",
  "transponder": "4521",
  "departure": "EKCH",
  "arrival": "ESGG",
  "route": "XAMEL T323 VAMM",
  "rfl": "FL340",
  "eta": "1545",
  "tas": "440"
}
```

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Flight strip for SAS123 printed successfully",
  "callsign": "SAS123",
  "type": "departure",
  "blank": false
}
```

### Blank Strip Success (200 OK)
```json
{
  "success": true,
  "message": "Blank flight strip printed successfully",
  "callsign": null,
  "type": "departure",
  "blank": true
}
```

### Success with Fallback (200 OK)
If image printing fails but text fallback succeeds:
```json
{
  "success": true,
  "message": "Printed using text fallback",
  "warning": "Image printing failed, used text mode",
  "callsign": "SAS123"
}
```


### Server Error (500 Internal Server Error)
```json
{
  "error": "Failed to print flight strip",
  "details": "Printer not connected after reset",
  "callsign": "SAS123"
}
```

## Integration Examples

### JavaScript/Node.js
```javascript
async function printFlightStrip(flightData) {
  try {
    const response = await fetch('http://localhost:3000/api/print/external', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(flightData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✓ Printed: ${result.callsign}`);
    } else {
      console.error(`✗ Print failed: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
}

// Usage - regular strip
printFlightStrip({
  callsign: 'SAS123',
  type: 'departure',
  aircraft: 'A320',
  departure: 'ESGG',
  arrival: 'ESSA',
  flightRules: 'I',
  rfl: 'FL370'
});

// Usage - blank departure strip
printFlightStrip({});

// Usage - blank arrival strip
printFlightStrip({ type: 'arrival' });

// Usage - with Y flight rules (IFR changing to VFR)
printFlightStrip({
  callsign: 'NAX789',
  type: 'departure',
  flightRules: 'Y',
  aircraft: 'C172',
  departure: 'ESSA',
  arrival: 'ESSB',
  route: 'DCT URNIS VFR',
  rfl: 'FL095'
});

// Usage - with Z flight rules (VFR changing to IFR)
printFlightStrip({
  callsign: 'SE-ABC',
  type: 'departure',
  flightRules: 'Z',
  aircraft: 'PA28',
  departure: 'ESSB',
  arrival: 'ESSA',
  route: 'VFR URNIS IFR',
  rfl: 'A035'
});
```

### Python
```python
import requests
import json

def print_flight_strip(flight_data):
    url = 'http://localhost:3000/api/print/external'
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(url, headers=headers, json=flight_data)
        result = response.json()
        
        if result.get('success'):
            print(f"✓ Printed: {result.get('callsign')}")
        else:
            print(f"✗ Print failed: {result.get('error')}")
            
        return result
    except Exception as error:
        print(f"Network error: {error}")
        raise

# Usage
print_flight_strip({
    'callsign': 'SAS123',
    'type': 'departure',
    'aircraft': 'A320',
    'departure': 'ESGG',
    'arrival': 'ESSA',
    'flightRules': 'I',
    'rfl': 'FL370'
})
```

### C#
```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public class FlightStripPrinter
{
    private static readonly HttpClient client = new HttpClient();
    private const string API_URL = "http://localhost:3000/api/print/external";
    
    public static async Task<bool> PrintFlightStrip(object flightData)
    {
        try
        {
            var json = JsonSerializer.Serialize(flightData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            var response = await client.PostAsync(API_URL, content);
            var resultJson = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(resultJson);
            
            if (result.GetProperty("success").GetBoolean())
            {
                Console.WriteLine($"✓ Printed: {result.GetProperty("callsign").GetString()}");
                return true;
            }
            else
            {
                Console.WriteLine($"✗ Print failed: {result.GetProperty("error").GetString()}");
                return false;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Network error: {ex.Message}");
            return false;
        }
    }
}

// Usage
await FlightStripPrinter.PrintFlightStrip(new
{
    callsign = "SAS123",
    type = "departure",
    aircraft = "A320",
    departure = "ESGG",
    arrival = "ESSA",
    flightRules = "I",
    rfl = "FL370"
});
```

### cURL (Testing)
```bash
# Blank strip test
curl -X POST http://localhost:3000/api/print/external \
  -H "Content-Type: application/json" \
  -d '{}'

# Blank arrival strip test
curl -X POST http://localhost:3000/api/print/external \
  -H "Content-Type: application/json" \
  -d '{"type":"arrival"}'

# Minimal test
curl -X POST http://localhost:3000/api/print/external \
  -H "Content-Type: application/json" \
  -d '{"callsign":"SAS123"}'

# Complete departure test
curl -X POST http://localhost:3000/api/print/external \
  -H "Content-Type: application/json" \
  -d '{
    "callsign": "SAS123",
    "type": "departure",
    "flightRules": "I",
    "aircraft": "A320",
    "wtc": "M",
    "transponder": "2301",
    "sid": "VAMM1A",
    "departure": "ESGG",
    "arrival": "ESSA",
    "route": "DCT XAMEL M609 NILUG",
    "rfl": "FL370",
    "eobt": "1430",
    "tas": "450"
  }'

# Complete arrival test with ETA
curl -X POST http://localhost:3000/api/print/external \
  -H "Content-Type: application/json" \
  -d '{
    "callsign": "DAL456",
    "type": "arrival",
    "flightRules": "I",
    "aircraft": "B738",
    "wtc": "M",
    "transponder": "4521",
    "departure": "EKCH",
    "arrival": "ESGG",
    "route": "XAMEL T323 VAMM",
    "rfl": "FL340",
    "eta": "1545",
    "tas": "440"
  }'

# Test with Y flight rules (IFR changing to VFR)
curl -X POST http://localhost:3000/api/print/external \
  -H "Content-Type: application/json" \
  -d '{
    "callsign": "NAX789",
    "type": "departure",
    "flightRules": "Y",
    "aircraft": "C172",
    "wtc": "L",
    "transponder": "7001",
    "departure": "ESSA",
    "arrival": "ESSB",
    "route": "DCT URNIS VFR",
    "rfl": "FL095",
    "eobt": "1615",
    "tas": "120"
  }'

# Test with Z flight rules (VFR changing to IFR)
curl -X POST http://localhost:3000/api/print/external \
  -H "Content-Type: application/json" \
  -d '{
    "callsign": "SE-ABC",
    "type": "departure",
    "flightRules": "Z",
    "aircraft": "PA28",
    "wtc": "L",
    "transponder": "7002",
    "departure": "ESSB",
    "arrival": "ESSA",
    "route": "VFR URNIS IFR",
    "rfl": "A035",
    "eobt": "1730",
    "tas": "110"
  }'
```

## VatIRIS Integration Guidelines

### Where to Add the Integration
The integration should be added to VatIRIS's flight plan display or flight list interface where controllers can:
1. Right-click on a flight and select "Print Strip"
2. Use a keyboard shortcut to print the selected flight
3. Automatically print when accepting a handoff or clearance

### Recommended Implementation
1. **User Action**: Add a context menu item or button labeled "Print Strip" in the flight list
2. **Data Mapping**: Map VatIRIS's internal flight data structure to the API format
3. **API Call**: Make an HTTP POST request to `http://localhost:3000/api/print/external`
4. **User Feedback**: Show a notification on success/failure
5. **Error Handling**: Log errors and notify the user if printing fails

### Example VatIRIS Flow
```
User Action (Right-click → Print Strip)
  ↓
Extract flight data from VatIRIS
  ↓
Map to API format
  ↓
HTTP POST to /api/print/external
  ↓
Display success/error notification
```

### Configuration
VatIRIS should include settings for:
- **FSP Server URL**: Default `http://localhost:3000`, user-configurable
- **Auto-print on events**: Optional auto-print on handoff/clearance
- **Strip type preference**: Default departure/arrival based on controller position

## System Requirements

### FSP Server
- Node.js 14+ must be installed
- FSP backend server must be running (`npm start` in backend folder)
- Thermal printer must be connected and configured

### Network
- Both VatIRIS and FSP must be on the same machine or local network
- Default port: 3000 (configurable in `backend/config.js`)
- No firewall blocking between applications

## Testing the Integration

### 1. Verify FSP Server is Running
```bash
curl http://localhost:3000/api/printer/status
```
Expected response:
```json
{
  "connected": true,
  "deviceInfo": "USB Thermal Printer (1046:20497)"
}
```

### 2. Test Print Request
```bash
curl -X POST http://localhost:3000/api/print/external \
  -H "Content-Type: application/json" \
  -d '{"callsign":"TEST123","type":"departure","aircraft":"A320","departure":"ESGG","arrival":"ESSA"}'
```

### 3. Verify Physical Output
Check that the thermal printer produces a flight strip with the test data.

## Troubleshooting

### "Printer not connected"
- Ensure thermal printer is powered on and connected via USB
- Restart the FSP backend server
- Check printer status via `/api/printer/status`

### "Network error" / Connection refused
- Verify FSP backend is running on port 3000
- Check that the server URL is correct in VatIRIS settings
- Ensure no firewall is blocking localhost connections

### "Invalid flight data"
- Verify the `callsign` field is included in the request
- Check JSON formatting is valid
- Review the error response for specific validation details

## Support
For issues with the FSP API or integration questions, refer to:
- FSP Repository: [Your repository URL]
- API Documentation: This file
- Configuration: `backend/config.js`

