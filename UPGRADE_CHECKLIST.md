# Flight Strip System Upgrade Checklist

## ✅ Completed Changes

### Files Moved
- [x] `new/striparrival.svg` → `templates/striparrival.svg`
- [x] `new/stripdeparture.svg` → `templates/stripdeparture.svg`
- [x] `new/strip.svg` → `templates/strip.svg`

### Backend Updates
- [x] Created `backend/sidService.js` for SID detection
- [x] Updated `backend/vatsim.js` with:
  - Flight rules determination (I/V/Y/Z)
  - RFL altitude formatting (F360, A50 format)
  - SID detection integration
  - Runway parameter support
- [x] Updated `backend/stripRenderer.js`:
  - New field names (CALLSIGN, FRUL, ATYP, ASSR, SID, ADEP, ADES, RTE, RFL)
  - Template auto-selection (arrival/departure/generic)
- [x] Updated `backend/server.js`:
  - Runway query parameter support
  - Blank strip printing endpoint

### Frontend Updates
- [x] Updated `frontend/src/services/api.js`:
  - Runway parameter in getFlights()
  - printBlank() method
- [x] Updated `frontend/src/App.vue`:
  - Runway selection dropdown
  - Blank departure strip button
  - Blank arrival strip button
  - Auto-refresh with runway context

## 📋 Field Mappings Reference

| SVG Field | Data Source | Format/Notes |
|-----------|-------------|--------------|
| CALLSIGN | pilot.callsign | Direct |
| FRUL | Calculated | I/V/Y/Z based on rules + route analysis |
| ATYP | flight_plan.aircraft_short | Aircraft type |
| ASSR | pilot.transponder | Squawk code |
| SID | Auto-detected | From route matching (runway required) |
| ADEP | flight_plan.departure | Departure ICAO |
| ADES | flight_plan.arrival | Destination ICAO |
| RTE | flight_plan.route | Truncated to fit |
| RFL | flight_plan.altitude | F360 (>5000ft) or A50 (≤5000ft) |

## 🔍 Verification Steps

### 1. Backend
```bash
cd backend
npm install  # Ensure all dependencies are installed
npm start    # Should start on port 3000
```

### 2. Frontend (if running separately)
```bash
cd frontend
npm install
npm run dev  # Development mode on port 5173
```

### 3. Production Build
```bash
npm run build   # From root
npm start       # From root
```

### 4. Test SID Detection
1. Open http://localhost:3000
2. Select airport: **ESGG** (Göteborg Landvetter)
3. Select runway: **03** or **21**
4. Verify departures show SID field populated
5. Example flight to test:
   - Route containing: `GG401 GG901 GG902 DETNA` → Should show `DETNA3M`

### 5. Test Flight Rules
1. Find IFR flight with "VFR" in route → Should show **Y**
2. Find VFR flight with "IFR" in route → Should show **Z**
3. Regular IFR flight → Should show **I**
4. Regular VFR flight → Should show **V**

### 6. Test Altitude Formatting
- 36000ft → **F360**
- 25000ft → **F250**
- 5000ft → **A50**
- 3000ft → **A30**
- 1500ft → **A15**

### 7. Test Blank Printing
1. Click "Print Blank Departure" → Should print empty departure strip
2. Click "Print Blank Arrival" → Should print empty arrival strip

## 📝 Known Limitations

1. **SID Detection Requirements**:
   - Requires runway selection
   - Depends on accurate route data from pilots
   - Only works for airports in SID.txt database

2. **Altitude Formatting**:
   - Assumes altitudes in feet
   - Formats automatically (no manual override)

3. **Font Files**:
   - SVG templates may reference fonts (HGSoeiKakugothicUB, Tahoma)
   - Ensure fonts are embedded in SVG or available on system

## 🔧 Troubleshooting

### SID not appearing
- ✓ Check runway is selected
- ✓ Verify airport exists in data/SID.txt
- ✓ Check pilot's route contains SID waypoints
- ✓ Confirm route field is populated

### Wrong flight rules
- ✓ Verify flight_plan.flight_rules in VATSIM data
- ✓ Check for VFR/IFR text in route/remarks
- ✓ Review determineFlightRules() logic

### Altitude not formatting
- ✓ Confirm altitude is numeric
- ✓ Check formatRFL() function
- ✓ Verify altitude data from VATSIM

### Template not found
- ✓ Ensure templates/ folder contains all three SVG files
- ✓ Check file permissions
- ✓ Verify templateDir path in stripRenderer.js

## 📄 Old Files

The following file is now obsolete but kept for reference:
- `templates/flight-strip.svg` (old double-bracket template)

You may safely delete it after confirming the new system works correctly.

## 🚀 Next Steps

As mentioned, more fields will be added later. To add new fields:

1. **Add field to SVG template**
   - Use plain text name (e.g., `NEWFIELD`)
   
2. **Update stripRenderer.js replacements**
   ```javascript
   'NEWFIELD': flightData.newField || ''
   ```

3. **Add data extraction in vatsim.js**
   ```javascript
   newField: this.extractNewField(flightPlan),
   ```

4. **Add extraction/formatting method**
   ```javascript
   extractNewField(flightPlan) {
     // Your logic here
   }
   ```

## 📞 Support

For questions about:
- **Field meanings**: See NEW_STRIP_SYSTEM.md
- **SID format**: See data/SID.txt and [EuroScope ESE documentation](https://www.euroscope.hu/wp/ese-files-description/)
- **VATSIM data**: https://data.vatsim.net/v3/vatsim-data.json

