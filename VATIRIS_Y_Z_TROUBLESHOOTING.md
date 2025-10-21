# VatIRIS Y/Z Flight Rules Troubleshooting Checklist

Quick reference for debugging Y/Z flight rule printing issues in VatIRIS integration.

## Quick Test

### Test 1: Verify FSP Backend Supports Y/Z

Run these curl commands to verify the FSP backend is working:

```bash
# Test Y flight rule
curl -X POST http://localhost:3000/api/print/external \
  -H "Content-Type: application/json" \
  -d '{"callsign":"TEST_Y","flightRules":"Y","aircraft":"C172","departure":"ESSA","arrival":"ESSB"}'

# Test Z flight rule  
curl -X POST http://localhost:3000/api/print/external \
  -H "Content-Type: application/json" \
  -d '{"callsign":"TEST_Z","flightRules":"Z","aircraft":"PA28","departure":"ESSB","arrival":"ESSA"}'
```

**Expected Result**: Both should return `{"success":true,...}` and print strips with Y or Z in the FRUL field.

✓ If this works → Backend is OK, issue is in VatIRIS  
✗ If this fails → Backend issue, check server logs

---

## Troubleshooting Steps

### Step 1: Check VatIRIS is Sending Y/Z

**In VatIRIS code**, add logging before the API call:

```javascript
// Example VatIRIS integration code
const flightData = {
  callsign: pilot.callsign,
  flightRules: pilot.flightPlan.flightRules, // <- LOG THIS
  // ... other fields
};

console.log('Sending to FSP:', JSON.stringify(flightData, null, 2));

// API call
fetch('http://localhost:3000/api/print/external', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(flightData)
});
```

**Check the logs:**
- ✓ If you see `"flightRules": "Y"` or `"flightRules": "Z"` → VatIRIS is sending correctly
- ✗ If you see `"flightRules": "I"` or `"flightRules": "V"` → VatIRIS is transforming Y/Z to I/V

### Step 2: Check Flight Plan Source

**Where is VatIRIS getting the flight rules from?**

```javascript
// Check the source of flight rules data
console.log('Raw pilot data:', pilot.flightPlan);
console.log('Flight rules field:', pilot.flightPlan.flight_rules); // VATSIM API uses snake_case
```

**VATSIM API field name**: `flight_plan.flight_rules` (snake_case)
**FSP API field name**: `flightRules` or `flightType` (camelCase)

Make sure the mapping preserves the Y/Z value:

```javascript
// ✓ CORRECT
flightRules: pilot.flight_plan?.flight_rules || ''

// ✗ INCORRECT - might be converting Y/Z to I/V
flightRules: pilot.flight_plan?.flight_rules === 'Y' || pilot.flight_plan?.flight_rules === 'Z' ? 'I' : pilot.flight_plan?.flight_rules
```

### Step 3: Check for Filters or Validators

**Search VatIRIS code for:**

```javascript
// Look for code that might be filtering Y/Z
if (flightRules === 'I' || flightRules === 'V') { ... }

// Or switch statements that don't handle Y/Z
switch (flightRules) {
  case 'I': ...
  case 'V': ...
  // Y and Z missing?
}

// Or validation that rejects Y/Z
const validRules = ['I', 'V']; // Should include 'Y' and 'Z'
```

### Step 4: Check Backend Logs

**Start FSP backend with logging:**

```bash
cd backend
npm start
```

When VatIRIS triggers a print, you should see:

```
External print request for: [CALLSIGN] from VatIRIS/external
```

The backend logs will show the exact data received. If the backend receives "I" or "V" but VatIRIS sent "Y" or "Z", there's a middleware or proxy issue.

### Step 5: Check the Printed Strip

After printing, physically check the strip:

- Look at the **FRUL** field on the printed strip
- It should show: `Y` or `Z` (not `I` or `V`)

---

## Common Issues and Fixes

### Issue 1: VatIRIS Converts Y/Z to I/V

**Symptom**: Backend receives "I" or "V" instead of "Y" or "Z"

**Cause**: VatIRIS code is simplifying flight rules before sending to FSP

**Fix**: Update VatIRIS mapping to preserve Y/Z:

```javascript
// Before (incorrect)
flightRules: pilot.flight_plan.flight_rules === 'I' ? 'I' : 'V'

// After (correct)
flightRules: pilot.flight_plan.flight_rules || ''
```

### Issue 2: Wrong Field Name

**Symptom**: Flight rules are empty or default to blank

**Cause**: Field name mismatch (VATSIM uses `flight_rules`, FSP uses `flightRules`)

**Fix**: Map the field correctly:

```javascript
// ✓ CORRECT
{
  flightRules: pilot.flight_plan.flight_rules  // snake_case → camelCase
}

// ✗ INCORRECT
{
  flightRules: pilot.flight_plan.flightRules   // This field doesn't exist in VATSIM data
}
```

### Issue 3: Validation Rejects Y/Z

**Symptom**: API returns error or strips print blank

**Cause**: VatIRIS has validation that only allows "I" or "V"

**Fix**: Update validation to allow Y/Z:

```javascript
// Before
const validRules = ['I', 'V'];

// After
const validRules = ['I', 'V', 'Y', 'Z'];

// Or just remove the validation (FSP handles all values)
```

### Issue 4: Old Documentation

**Symptom**: Developer thinks Y/Z aren't supported

**Cause**: Old API documentation only mentioned I/V

**Fix**: Refer to updated `VATIRIS_INTEGRATION_API.md` which now documents Y/Z support

---

## Expected Behavior

### Correct Flow:

1. Pilot files flight plan with Y or Z flight rules in VATSIM
2. VatIRIS reads `pilot.flight_plan.flight_rules` → value is "Y" or "Z"
3. VatIRIS sends to FSP API: `{"flightRules": "Y"}` or `{"flightRules": "Z"}`
4. FSP backend receives and processes the request
5. Strip renderer puts "Y" or "Z" in the FRUL field
6. Printed strip shows "Y" or "Z"

### ICAO Flight Rules Reference:

| Code | Meaning |
|------|---------|
| I | IFR (entire flight) |
| V | VFR (entire flight) |
| Y | IFR first, changing to VFR |
| Z | VFR first, changing to IFR |

---

## Need Help?

If Y/Z still don't work after checking all of the above:

1. **Capture network traffic**: Use browser dev tools or Wireshark to see the exact JSON being sent from VatIRIS to FSP
2. **Check both logs**: VatIRIS logs + FSP backend logs to compare what's sent vs received
3. **Test with curl**: Verify FSP backend works independently using the test commands at the top
4. **Review VatIRIS code**: Search for "flight" + "rules" in VatIRIS codebase to find all related code

---

**Quick Summary:**
- ✓ FSP backend supports Y/Z (verified working)
- ✓ API accepts Y/Z (verified working)
- ❓ VatIRIS mapping needs review (check your integration code)

The issue is most likely in VatIRIS's data mapping or validation logic, not in the FSP system.

