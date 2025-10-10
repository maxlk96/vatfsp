# Printer Access Error Fix

## Error: LIBUSB_ERROR_ACCESS

This error occurs when the USB device is locked or inaccessible.

## Quick Fixes (in order)

### 1. Unplug and Replug
- Unplug the printer USB cable
- Wait 5 seconds
- Plug it back in
- Restart the backend

### 2. Close Other Programs
- Close any printer management software
- Close Device Manager if open
- Make sure no other Node.js processes are running

### 3. Restart Backend Properly
```bash
# Stop the backend (Ctrl+C)
# Then restart
npm start
```

### 4. Check Windows Device Manager
- Open Device Manager
- Look under "Printers" or "USB devices"
- If you see a yellow warning icon, right-click and "Update driver" or "Uninstall device"
- Unplug and replug the printer

### 5. Run as Administrator (if needed)
Sometimes Windows needs elevated permissions:
```bash
# Close current terminal
# Open PowerShell as Administrator
# Navigate to project
cd C:\Users\maxlk\Desktop\vatsim-flight-strip-printer
npm start
```

### 6. Reboot (last resort)
If nothing else works:
- Save your work
- Reboot Windows
- Reconnect printer
- Start backend

## Prevention

The USB connection stays open between prints. If you need to disconnect the printer:
1. Stop the backend first (Ctrl+C)
2. Then unplug the printer
3. This prevents access locks

## Normal Startup Log

When working correctly, you should see:
```
Scanning 17 USB devices:
  ...
  1046:20497 (0x416:0x5011) ← POS-5890K THERMAL PRINTER
✓ Selected: POS-5890K thermal printer (1046:20497)

Device has 1 interface(s)
✓ USB endpoint configured successfully on interface 0
USB connection opened successfully
Printer connected successfully
Printer initialized with ESC/POS commands
```

