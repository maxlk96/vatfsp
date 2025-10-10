# New Flight Strip System - Implementation Summary

## Overview
The flight strip system has been updated to use new SVG templates with direct field names (no double brackets) and enhanced functionality for Swedish airports with SID detection and runway-based automation.

## Changes Made

### 1. New SVG Templates
Moved from `new/` to `templates/`:
- **striparrival.svg** - Template for arrival strips
- **stripdeparture.svg** - Template for departure strips  
- **strip.svg** - Generic blank strip template

### 2. Field Name Mapping

The new templates use the following field names (without double brackets):

| Field Name | Description | Source |
|-----------|-------------|--------|
| `CALLSIGN` | Aircraft callsign | Direct from VATSIM |
| `FRUL` | Flight rules (I/V/Y/Z) | Calculated (see below) |
| `ATYP` | Aircraft type | From flight plan |
| `ASSR` | Transponder/squawk code | Direct from VATSIM |
| `SID` | Standard Instrument Departure | Auto-detected from route |
| `ADEP` | Departure airport | From flight plan |
| `ADES` | Destination airport | From flight plan |
| `RTE` | Route | From flight plan (truncated) |
| `RFL` | Requested Flight Level | Formatted altitude (see below) |

### 3. Flight Rules Logic (FRUL)

Flight rules are determined with special cases:
- **I** = IFR (default)
- **V** = VFR
- **Y** = Filed as IFR but "VFR" appears anywhere in route or remarks
- **Z** = Filed as VFR but "IFR" appears anywhere in route or remarks

### 4. Altitude Formatting (RFL)

Altitudes are automatically formatted:
- **Above 5000ft**: Flight level format (e.g., 36000ft → `F360`)
- **5000ft or below**: Altitude format (e.g., 5000ft → `A50`, 3000ft → `A30`)

### 5. SID Detection System

#### Data Source
- SID data loaded from `data/SID.txt` (EuroScope ESE format)
- Format: `SID:AIRPORT:RUNWAY:SID_NAME:WAYPOINT1 WAYPOINT2 ...`

#### Detection Logic
1. **Explicit Detection**: If SID name appears in the route
2. **Route Matching**: Compares route waypoints with SID end waypoints
3. **Runway-Based**: Only checks SIDs for the selected runway

#### Runway Selection
- New UI control in the frontend to select active runway
- SID detection only works when a runway is selected
- Automatically loads available runways from SID database for each airport

### 6. Backend Changes

#### New Files
- **`backend/sidService.js`** - SID parsing and matching service
  - Loads SID data from `data/SID.txt`
  - Matches SIDs based on airport, runway, and route
  - Returns available runways for each airport

#### Updated Files
- **`backend/vatsim.js`**
  - Added SID service integration
  - Added flight rules determination
  - Added RFL formatting
  - Added runway parameter support
  - Returns available runways with flight data

- **`backend/stripRenderer.js`**
  - Updated to use new field names (CALLSIGN, FRUL, ATYP, etc.)
  - Auto-selects template based on flight type (arrival/departure)
  - Removed double-bracket placeholder system

- **`backend/server.js`**
  - Added runway query parameter to `/api/flights/:icao` endpoint
  - Added `/api/print-blank` endpoint for blank strip printing

### 7. Frontend Changes

#### Updated Files
- **`frontend/src/App.vue`**
  - Added runway selection dropdown
  - Added "Print Blank Departure" button
  - Added "Print Blank Arrival" button
  - Runway selection automatically triggers SID detection
  - Runways are loaded from backend

- **`frontend/src/services/api.js`**
  - Updated `getFlights()` to accept runway parameter
  - Added `printBlank()` method

## How It Works

### Workflow for Departure Strips

1. **Select Airport**: User selects an airport (e.g., ESGG)
2. **Load Runways**: System loads available runways from SID database
3. **Select Runway**: User selects active runway (e.g., "03")
4. **Fetch Flights**: System fetches VATSIM data with runway context
5. **Detect SIDs**: For each departure:
   - Checks if SID name is in route
   - Matches route waypoints with SID endpoints for selected runway
   - Populates SID field on strip
6. **Format Data**: 
   - Determines flight rules (I/V/Y/Z)
   - Formats altitude (F360 or A50 format)
7. **Render Strip**: Uses `stripdeparture.svg` template
8. **Print**: Sends to thermal printer

### Workflow for Arrival Strips

1. **Select Airport & Runway** (same as departures)
2. **Fetch Arrivals**: Gets flights destined for the airport
3. **Format Data**: Flight rules and altitude formatting
4. **Render Strip**: Uses `striparrival.svg` template
5. **Print**: Sends to thermal printer

### Blank Strips

- Click "Print Blank Departure" or "Print Blank Arrival"
- System renders template with empty fields
- Useful for manual fill-in

## API Endpoints

### GET `/api/flights/:icao?runway=<runway>`
- Returns arrivals, departures, and available runways
- Optional runway parameter enables SID detection
- Example: `/api/flights/ESGG?runway=03`

### POST `/api/print`
- Prints a flight strip with data
- Body: flight data object

### POST `/api/print-blank`
- Prints a blank strip
- Body: `{ "type": "departure" | "arrival" }`

## Configuration

### SID Data Format (data/SID.txt)
```
SID:AIRPORT:RUNWAY:SID_NAME:WAYPOINT1 WAYPOINT2 ...
```

Example:
```
SID:ESGG:03:DETNA3M:GG401 GG901 GG902 DETNA
```

## Future Enhancements

As noted by the user, more fields will be added to the strips at a later time. The current system is designed to be extensible:

1. **Add new fields to SVG templates** - Just add the field name as text
2. **Update stripRenderer.js** - Add the field to the replacements object
3. **Update vatsim.js** - Add data extraction/formatting logic

## Testing

To test the new system:

1. **Start the backend**: `npm start` (in root)
2. **Access frontend**: http://localhost:3000
3. **Select ESGG airport** (default, has SID data)
4. **Select runway "03" or "21"**
5. **Observe SID field populated** on departure strips
6. **Test blank printing** using the buttons

## Notes

- The system is optimized for Swedish airports (ES** ICAOs)
- SID detection requires accurate route data from pilots
- Runway selection is optional but required for SID detection
- The generic `strip.svg` is available but not currently used (arrivals/departures have specific templates)

