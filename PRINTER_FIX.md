# Printer Connection Fix - Summary

## Issues Found

### 1. USB Endpoint Detection Failure
**Problem**: The printer was only checking interface 0 for an OUT endpoint, but some printers use different interface numbers.

**Error Message**: `No OUT endpoint found`

**Solution**: Updated the USB adapter to:
- Loop through all available interfaces
- Check each interface for a bulk OUT endpoint
- Claim the first interface with a valid endpoint
- Log interface and endpoint details for debugging

### 2. Connection State Mismatch
**Problem**: The printer reported "connected successfully" even when USB connection failed.

**Cause**: Asynchronous callback set `isConnected = false`, but synchronous code immediately set it to `true` afterwards.

**Solution**: 
- Only set `isConnected = true` inside the success callback
- Set `printer = null` when connection fails
- Return actual connection status from `connect()` method

### 3. Text Printing Using Old Field Names
**Problem**: Text fallback printer was using deprecated field names (altitude, aircraft) instead of new field names (rfl, ATYP).

**Solution**: Updated `printText()` to support both old and new field names:
```javascript
flightData.rfl || flightData.RFL || flightData.altitude
flightData.aircraft || flightData.ATYP
flightData.transponder || flightData.ASSR
```

### 4. Missing Flight Rules and SID in Text Output
**Problem**: Text printer wasn't showing the new fields (FRUL, SID).

**Solution**: Added to text print format:
- Flight rules (FRUL) shown with type
- SID shown for departures only
- All new field mappings supported

## Updated Code

### USB Adapter - Interface Detection
Now tries all interfaces instead of just interface 0:

```javascript
for (let i = 0; i < interfaceCount && !foundEndpoint; i++) {
  this.interface = this.device.interface(i);
  this.interface.claim();
  
  // Find bulk OUT endpoint
  this.endpoint = this.interface.endpoints.find(e => 
    e.direction === 'out' && e.transferType === usb.LIBUSB_TRANSFER_TYPE_BULK
  );
  
  if (this.endpoint) {
    foundEndpoint = true;
    console.log(`USB endpoint configured on interface ${i}`);
  }
}
```

### Connection State Management
Only marks as connected when USB actually opens:

```javascript
adapter.open((openError) => {
  if (openError) {
    this.isConnected = false;
    this.printer = null;
  } else {
    this.printer = new escpos.Printer(adapter);
    this.isConnected = true;
  }
});
```

### Text Print Format
Updated to show new fields:

```
========================
        AFR1049
========================
Type: DEP  Rules: I
A/C:  A320
Sqwk: 1234
From: ESGG
To:   LFPG
RFL:  F370
SID:  DETNA3M
------------------------
Route:
DETNA UL613 KONAN
========================
Printed: 14:32:15
```

## Testing Steps

1. **Restart the backend** to apply fixes:
   ```bash
   npm start
   ```

2. **Check connection logs**:
   - Should see: `Device has X interface(s)`
   - Should see: `USB endpoint configured on interface Y`
   - Should see: `Endpoint address: 0xNN`
   - Should see: `Printer connected successfully`

3. **Test print**:
   - Click "Test Printer" in UI
   - Should see: `Sending test print...`
   - Should see: `Test print sent to printer`
   - **Should physically print** on thermal printer

4. **Test flight strip**:
   - Print any departure strip
   - Should show all new fields (Rules, RFL, SID)
   - Should physically print

5. **Test blank strip**:
   - Click "Print Blank Departure"
   - Should print empty strip with all field labels

## Expected Console Output

### Successful Connection:
```
Found 1 potential printer device(s)
Found printer device: { vendor: 6790, product: 57382 }
Device has 1 interface(s)
USB endpoint configured successfully on interface 0
Endpoint address: 0x3
USB connection opened successfully
Printer initialized with ESC/POS commands
Printer connected successfully
```

### Failed Connection:
```
Found 1 potential printer device(s)
Found printer device: { vendor: 6790, product: 57382 }
Device has 1 interface(s)
Interface 0 error: <error message>
Failed to open USB connection: Error: No OUT endpoint found on any interface
```

## Troubleshooting

### Still says "No OUT endpoint found"
1. Check if printer is powered on
2. Try unplugging and replugging USB
3. Check Windows Device Manager for USB errors
4. Try different USB port
5. Check printer driver installation

### Prints but output is garbled
1. Wrong printer model - POS-5890K uses ESC/POS protocol
2. Check baud rate settings (not applicable for USB, but thermal printers might have DIP switches)
3. Try different USB cable

### "Printer not connected" error
1. Check `isConnected` status in logs
2. Verify USB adapter opened successfully
3. May need to restart backend after printer power cycle

### Text prints but blank strip fails
1. Check blank strip endpoint logs
2. Verify flightData fields are being passed correctly
3. Check that fallback is being triggered

## Next Steps

Once printing is confirmed working:

1. **Enable image printing** (currently disabled in line 259-260 of printer.js)
   - Will need to resolve PNG/Sharp format issues
   - Current SVG → PNG conversion works, but escpos image loader has issues

2. **Test with actual VATSIM data**
   - Verify all fields appear correctly
   - Test SID detection with Swedish airports
   - Verify flight rules (Y/Z) detection

3. **Font optimization**
   - SVG templates may reference specific fonts
   - Consider embedding fonts in SVG or using system fonts

## Files Modified

- `backend/printer.js`
  - Updated USB adapter interface detection
  - Fixed connection state management  
  - Updated text print format with new fields
  - Added support for both old and new field names

