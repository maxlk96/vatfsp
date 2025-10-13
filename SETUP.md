# VatFSP Setup Guide

Complete setup instructions for the VATSIM Flight Strip Printer system.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Printer Setup](#printer-setup)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)
- [Configuration](#configuration)

---

## Prerequisites

### 1. Node.js and npm
Install Node.js version 18 or higher:
- Visit: https://nodejs.org/
- Download the LTS (Long Term Support) version
- Run the installer
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

### 2. Build Tools (Windows)
The USB printer library requires native modules. Install ONE of:

**Option A: Automatic (Recommended)**
```bash
npm install --global windows-build-tools
```

**Option B: Manual**
- Install Visual Studio Build Tools 2019 or later
- Download from: https://visualstudio.microsoft.com/downloads/
- Select "Desktop development with C++"

### 3. POS-5890K Thermal Printer
- Connect the printer via USB
- Ensure the printer is powered on
- Load thermal paper

---

## Installation

### Step 1: Install Dependencies

Open a terminal in the project root directory:

```bash
npm run install:all
```

This installs dependencies for the root project, backend, and frontend.

**Note:** Warnings during installation are usually safe to ignore. Only errors need to be resolved.

### Step 2: Verify Installation

Check for any errors in the output. Common issues:
- ✅ Warnings: Usually safe to ignore
- ❌ Errors: Must be resolved before continuing

---

## Printer Setup

### Windows: Install WinUSB Driver with Zadig

The POS-5890K printer requires a WinUSB driver for direct USB communication on Windows.

#### Download and Install Zadig

1. Go to https://zadig.akeo.ie/
2. Download the latest version
3. Run `zadig.exe` as Administrator

#### Install WinUSB Driver

1. In Zadig, click **Options** → **List All Devices**
2. Find your printer device from the dropdown:
   - May show as "USB-Serial CH340" or similar
   - Or look for device ID: `1A86 E026`
3. In the target driver box (right side), select **WinUSB**
4. Click **Replace Driver** or **Install Driver**
5. Wait for installation to complete

#### Verify Driver Installation

In PowerShell, run:
```powershell
Get-PnpDevice -Class USB | Where-Object {$_.InstanceId -like "*1A86*"}
```

You should see your device listed with Status: OK

---

## Running the Application

### Development Mode

Start both backend and frontend servers:
```bash
npm run dev
```

This starts:
- Backend server on http://localhost:3000
- Frontend dev server on http://localhost:5173

Access the application at **http://localhost:5173**

### Production Mode

Build and run the production version:

```bash
# Build the frontend
npm run build

# Start production server
npm start
```

Access the application at **http://localhost:3000**

### Testing the Printer

1. Open the web interface
2. Check the printer status indicator (should show "Connected")
3. Click the printer test button in the top-right corner
4. Verify the test strip prints successfully

### Printing Flight Strips

1. Select an airport (default: ESGG)
2. Wait for VATSIM data to load (auto-refreshes every 15 seconds)
3. Select an active runway for SID detection
4. Click the print button next to any flight

---

## Troubleshooting

### Printer Not Detected

**Check USB Connection:**
- Verify USB cable is connected
- Ensure printer is powered on
- Check Windows Device Manager for USB devices
- Try different USB port

**Driver Issues:**
- Verify WinUSB driver is installed using Zadig
- Check Device Manager for yellow warning icons
- Try reinstalling the WinUSB driver

**Permission Issues:**
- Run PowerShell as Administrator
- Navigate to project directory
- Run `npm start` with elevated privileges

### USB Access Errors (LIBUSB_ERROR_ACCESS)

This error occurs when the USB device is locked or inaccessible.

**Quick Fixes:**
1. Unplug and replug the printer USB cable (wait 5 seconds)
2. Close any printer management software
3. Restart the backend (Ctrl+C, then `npm start`)
4. Check Device Manager for device conflicts
5. Reboot Windows (last resort)

**Prevention:**
- Always stop the backend (Ctrl+C) before unplugging the printer
- Don't have multiple applications accessing the printer simultaneously

### Build Errors on Windows

**Missing build tools:**
```bash
npm install --global windows-build-tools
```

Or install Visual Studio Build Tools 2019 or later.

**USB package errors:**
If you see errors related to the `usb` package, ensure:
- Build tools are installed
- Restart terminal after installing build tools
- Try cleaning and reinstalling: `npm run install:all`

### VATSIM Data Not Loading

**Check connectivity:**
- Verify internet connection
- Ensure firewall isn't blocking outbound HTTPS requests
- Check browser console for errors (F12)

### Printer Prints Blank or Garbled Output

**Check printer settings:**
- Verify correct thermal paper is loaded
- Ensure paper is loaded correctly (thermal side down)
- Test with the built-in printer test button

**USB communication issues:**
- Try different USB port
- Use different USB cable
- Verify WinUSB driver is installed correctly

### Port Already in Use

If port 3000 or 5173 is already in use:

1. Edit `backend/config.js` to change backend port
2. Edit `frontend/vite.config.js` to change dev server port

### Normal Startup Log

When working correctly, you should see:
```
Scanning USB devices...
Found printer device: { vendor: 6790, product: 57382 }
Device has 1 interface(s)
USB endpoint configured successfully on interface 0
USB connection opened successfully
Printer initialized with ESC/POS commands
Printer connected successfully
```

---

## Configuration

### Change Default Airport

Edit `backend/config.js`:
```javascript
defaultAirport: 'ESGG',  // Change to your airport
```

### Adjust Auto-Refresh Interval

Edit `backend/config.js`:
```javascript
refreshInterval: 15000,  // milliseconds (15 seconds)
```

### Configure SID Detection

SID data is loaded from `data/SID.txt` in EuroScope ESE format:
```
SID:AIRPORT:RUNWAY:SID_NAME:WAYPOINT1 WAYPOINT2 ...
```

Example:
```
SID:ESGG:03:DETNA3M:GG401 GG901 GG902 DETNA
```

### Customize Flight Strip Template

Edit SVG templates in the `templates/` folder:
- `stripdeparture.svg` - Departure strips
- `striparrival.svg` - Arrival strips
- `strip.svg` - Generic blank strip

---

## Remote Access

To access from other devices on your network:

1. Find your computer's IP address:
   - Windows: Run `ipconfig` in PowerShell
   - Look for "IPv4 Address" under your active network adapter

2. On other devices, navigate to:
   - Development: `http://<YOUR_IP>:5173`
   - Production: `http://<YOUR_IP>:3000`

3. Allow firewall access if prompted:
   - Windows Security → Firewall & network protection
   - Allow an app through firewall
   - Find "Node.js" and check both Private and Public

---

## Project Structure

```
vatfsp/
├── backend/              # Backend server (Node.js/Express)
│   ├── server.js        # Main server file
│   ├── vatsim.js        # VATSIM API client
│   ├── printer.js       # Printer controller
│   ├── stripRenderer.js # SVG to image converter
│   ├── sidService.js    # SID detection service
│   ├── wtcService.js    # Wake turbulence category lookup
│   └── config.js        # Configuration
├── frontend/            # Frontend application (Vue 3)
│   ├── src/
│   │   ├── App.vue      # Main app component
│   │   ├── components/  # Vue components
│   │   └── services/    # API service
│   └── index.html       # HTML entry point
├── templates/           # Flight strip SVG templates
│   ├── stripdeparture.svg
│   ├── striparrival.svg
│   └── strip.svg
├── data/                # Reference data
│   ├── SID.txt          # SID definitions
│   └── ICAO_Aircraft.txt # Aircraft type database
├── README.md            # Project overview
├── SETUP.md             # This file
└── VATIRIS_INTEGRATION_API.md # API documentation
```

---

## Next Steps

After successful installation:

1. ✅ Test printer connectivity
2. ✅ Verify VATSIM data loads
3. ✅ Print a test flight strip
4. 📝 Customize SVG templates if needed
5. 🌐 Set up remote access for networked devices
6. 🚀 Deploy to production mode

---

## Getting Help

If you encounter issues:

1. Check console output for error messages
2. Verify all prerequisites are installed
3. Review troubleshooting section above
4. Check printer USB connection and drivers
5. Ensure VATSIM API is accessible

For API integration with other software (like VatIRIS), see `VATIRIS_INTEGRATION_API.md`.

---

**Important:** Keep the terminal window open while using the application. The backend server must be running for the printer to function.
