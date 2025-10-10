# POS-5890K Printer Setup for Windows (Without Windows Drivers)

## The Issue
Your POS-5890K printer (Vendor: 6790/0x1A86, Product: 57382/0xE026) is detected as a USB device but doesn't have Windows printer drivers installed. This is normal for direct USB/ESC-POS communication.

## Solution: Install WinUSB Driver with Zadig

To communicate with the printer as a raw USB device on Windows, you need to install a WinUSB driver.

### Step 1: Download Zadig

1. Go to https://zadig.akeo.ie/
2. Download the latest version of Zadig
3. Run zadig.exe (you may need to run as Administrator)

### Step 2: Install WinUSB Driver

1. In Zadig, click **Options** → **List All Devices**
2. From the dropdown, find your printer device:
   - It might show as "USB-Serial CH340" or similar
   - Or look for device with ID: 1A86 E026
3. Select it from the list
4. In the target driver box (right side), select **WinUSB**
5. Click **Replace Driver** or **Install Driver**
6. Wait for installation to complete

### Step 3: Restart the Application

After installing the WinUSB driver:

1. Stop the VATSIM flight strip server (Ctrl+C)
2. Unplug and replug the printer USB cable
3. Restart the server: `npm run dev`

You should now see:
```
Found POS-5890K printer specifically
USB connection opened successfully
Printer initialized with ESC/POS commands
Printer connected successfully
```

### Step 4: Test Print

Click the test print button in the web interface. You should see:
- "Sending test print..."
- "Test print sent to printer"
- **Paper should feed out with test text**

## Alternative: Use Serial/COM Port

If the printer also has a serial port or appears as a COM port in Windows:

1. Check Device Manager for COM ports
2. Note the COM port number (e.g., COM3)
3. We can modify the code to use serial communication instead of USB

## Troubleshooting

### Zadig doesn't show my device
- Make sure the printer is powered on and connected
- Try clicking Options → List All Devices
- Restart Zadig as Administrator

### Driver installation failed
- Close any programs that might be using the device
- Try running Zadig as Administrator
- Restart Windows and try again

### Printer still not working after WinUSB
- Check Windows Device Manager:
  - Look under "Universal Serial Bus devices"
  - Your printer should appear with WinUSB driver
- Try different USB port
- Check USB cable

### Permission Errors
- Run the Node.js server as Administrator (right-click PowerShell → Run as Administrator)

## Technical Details

The POS-5890K uses a CH340 USB-to-Serial chip (Vendor ID: 0x1A86). On Windows, to access USB devices directly without manufacturer drivers, you need:

1. **WinUSB**: Generic Windows USB driver (recommended - use Zadig)
2. **libusb**: Alternative USB library (more complex)

The `usb` npm package we're using requires WinUSB or libusb to communicate with raw USB devices.

## Quick Test After Driver Installation

Run this in PowerShell to verify the driver:
```powershell
Get-PnpDevice -Class USB | Where-Object {$_.InstanceId -like "*1A86*"}
```

You should see your device listed with Status: OK

---

**Next Steps**: Install WinUSB driver using Zadig, then restart the application and try the test print! 🖨️


