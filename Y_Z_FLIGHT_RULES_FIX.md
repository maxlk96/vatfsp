# Y/Z Flight Rules Support - Issue Resolution

## Summary
Y and Z flight rules (IFR ↔ VFR transitions) **ARE supported** by the VATSIM Flight Strip Printer API and are printing correctly. The issue was that the documentation did not mention Y/Z support, which may have caused confusion during VatIRIS integration.

## What Was Fixed

### 1. Updated Documentation
Updated `VATIRIS_INTEGRATION_API.md` to explicitly document Y/Z flight rules support:

- **Line 27**: Changed from "I (IFR) or V (VFR)" to include "Y (IFR changing to VFR)" and "Z (VFR changing to IFR)"
- **Added test examples** for Y and Z flight rules in:
  - JavaScript/Node.js section (lines 224-245)
  - cURL testing section (lines 369-403)

### 2. Verification Testing
Tested both Y and Z flight rules successfully:

**Y Flight Rule Test** (IFR changing to VFR):
```json
{
  "callsign": "TEST_Y",
  "flightRules": "Y",
  "aircraft": "C172",
  "route": "DCT URNIS VFR"
}
```
✓ Result: Success - printed correctly

**Z Flight Rule Test** (VFR changing to IFR):
```json
{
  "callsign": "TEST_Z",
  "flightRules": "Z",
  "aircraft": "PA28",
  "route": "VFR URNIS IFR"
}
```
✓ Result: Success - printed correctly

## How It Works

### Backend Flow
1. VatIRIS sends `flightRules` field with value "Y" or "Z" to `/api/print/external`
2. Backend (`server.js` line 109) accepts the value: `flightRules: requestData.flightRules || requestData.flightType || ''`
3. Strip renderer (`stripRenderer.js` line 36) passes it to the template: `'FRUL': flightData.flightRules || ''`
4. SVG templates (`stripdeparture.svg`, `striparrival.svg`) display the value in the FRUL field
5. Strip prints with Y or Z displayed correctly

### Key Code Locations
- **API endpoint**: `backend/server.js` lines 82-197 (`/api/print/external`)
- **Strip rendering**: `backend/stripRenderer.js` lines 34-48 (template replacements)
- **VATSIM logic**: `backend/vatsim.js` lines 151-169 (flight rule determination for VATSIM data)

## For VatIRIS Integration Developers

### To Enable Y/Z Flight Rules in VatIRIS

When sending flight data from VatIRIS to the FSP API, ensure the `flightRules` field is populated with the correct value from the pilot's flight plan:

```javascript
// In VatIRIS integration code
const flightStripData = {
  callsign: pilot.callsign,
  flightRules: pilot.flightPlan.flightRules, // <- Make sure this includes Y/Z
  // ... other fields
};

// Send to FSP
await fetch('http://localhost:3000/api/print/external', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(flightStripData)
});
```

### Common Issues and Solutions

#### Issue: Y/Z not printing
**Cause**: VatIRIS may be mapping flight rules incorrectly or filtering Y/Z to I/V
**Solution**: Check the mapping between VatIRIS's internal data and the API call

#### Issue: Field name mismatch
**Cause**: Using wrong field name
**Solution**: Use `flightRules` (preferred) or `flightType` (alias) - both work

#### Issue: API returns success but wrong value prints
**Cause**: Data being transformed before sending to API
**Solution**: Log the exact JSON being sent to verify Y/Z is in the payload

## Testing from VatIRIS

To test Y/Z flight rules from VatIRIS:

1. Find a pilot with Y or Z flight rules in their flight plan
2. Right-click → "Print Strip" (or whatever action triggers the print)
3. Check the printed strip to verify the FRUL field shows "Y" or "Z"

Example test scenarios:
- **Y Rule**: IFR departure that will transition to VFR en route (e.g., training flight departing IFR from controlled airspace, then VFR to practice area)
- **Z Rule**: VFR departure that will transition to IFR en route (e.g., VFR departure below clouds, then IFR climb through cloud layer)

## ICAO Flight Rules Reference

For reference, here are the standard ICAO flight rules:

| Rule | Name | Description |
|------|------|-------------|
| **I** | IFR | Instrument Flight Rules (entire flight) |
| **V** | VFR | Visual Flight Rules (entire flight) |
| **Y** | Y-Rule | IFR first, then VFR (IFR → VFR) |
| **Z** | Z-Rule | VFR first, then IFR (VFR → IFR) |

## Verification

To verify your VatIRIS integration is sending Y/Z correctly:

1. Start the FSP backend with logging:
   ```bash
   cd backend
   npm start
   ```

2. In VatIRIS, trigger a print for a flight with Y or Z flight rules

3. Check backend console logs for the `flightRules` value:
   ```
   External print request for: TEST123 from VatIRIS/external
   ```

4. The printed strip should show "Y" or "Z" in the FRUL field

## Summary for VatIRIS Issue

If Y/Z flight rules are still not working in your VatIRIS integration:

1. ✓ **Backend supports Y/Z** - Verified working
2. ✓ **API accepts Y/Z** - Verified working  
3. ✓ **Printing works** - Verified working
4. ❓ **VatIRIS mapping** - Check this in VatIRIS code

The issue is likely in how VatIRIS is extracting and sending the `flightRules` field. Check:
- How VatIRIS reads flight plan data from VATSIM
- How VatIRIS maps internal flight data to the FSP API format
- Whether VatIRIS is filtering/transforming Y/Z to I/V before sending

## Contact

If issues persist after verifying VatIRIS is sending Y/Z correctly, check:
- Backend server logs for the actual received `flightRules` value
- The printed strip to see what value is actually being displayed
- Network logs to see the exact JSON payload being sent from VatIRIS

---

**Last Updated**: October 21, 2025
**Status**: ✓ Resolved - Documentation updated, Y/Z support verified working

