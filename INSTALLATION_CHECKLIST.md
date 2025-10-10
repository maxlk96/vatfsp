# Installation Checklist

## Prerequisites to Install

Before running this application, you need to install the following:

### 1. Node.js and npm

Download and install Node.js (version 18 or higher):
- Visit: https://nodejs.org/
- Download the LTS (Long Term Support) version
- Run the installer
- Verify installation by opening PowerShell and running:
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

### 3. POS-5890K Printer Setup

1. Connect the printer via USB
2. Power on the printer
3. Install drivers (if prompted by Windows)
4. The printer should appear in Device Manager under "Ports" or "USB devices"

## Installation Steps

Once prerequisites are installed:

### Step 1: Open PowerShell

Right-click on the project folder and select "Open in Terminal" or:
1. Press Win+X
2. Select "Windows PowerShell"
3. Navigate to: `cd C:\Users\maxlk\Desktop\vatsim-flight-strip-printer`

### Step 2: Install All Dependencies

```bash
npm run install:all
```

This will install dependencies for:
- Root project (concurrently)
- Backend server (Express, printer libraries, etc.)
- Frontend application (Vue, Vuetify, etc.)

**Expected time:** 2-5 minutes depending on internet speed

### Step 3: Verify Installation

Check for any errors in the output. Common issues:
- ✅ Warnings are usually safe to ignore
- ❌ Errors need to be resolved before continuing

### Step 4: Start Development

```bash
npm run dev
```

This starts both servers:
- Backend: http://localhost:3000 (with printer control)
- Frontend: http://localhost:5173 (web interface)

### Step 5: Test the Application

1. Open browser to http://localhost:5173
2. Check printer status in top-right (should show "Connected" if printer is detected)
3. Click the printer test icon to send a test print
4. Select airport ESGG (default) or any other
5. Wait for VATSIM data to load (15 seconds)
6. Click print button next to any flight

## Troubleshooting

### npm not recognized

Node.js is not installed or not in PATH:
- Reinstall Node.js from https://nodejs.org/
- Restart PowerShell after installation
- Verify with: `node --version`

### USB/escpos build errors

Missing build tools:
```bash
npm install --global windows-build-tools
```

Then retry:
```bash
npm run install:all
```

### Printer not connecting

- Check USB cable connection
- Verify printer is powered on
- Check Device Manager for USB devices
- Try different USB port
- Restart the backend server

### Firewall blocking

Allow Node.js through Windows Firewall:
1. Windows Security → Firewall & network protection
2. Allow an app through firewall
3. Find "Node.js" and check both Private and Public

## Project Structure

```
vatsim-flight-strip-printer/
├── backend/              Backend server (Node.js/Express)
│   ├── server.js        Main server file
│   ├── vatsim.js        VATSIM API client
│   ├── printer.js       Printer controller
│   ├── stripRenderer.js SVG to image converter
│   └── config.js        Configuration
├── frontend/            Frontend application (Vue 3)
│   ├── src/
│   │   ├── App.vue      Main app component
│   │   ├── components/  Vue components
│   │   └── services/    API service
│   └── index.html       HTML entry point
├── templates/           Flight strip templates
│   └── flight-strip.svg SVG template
├── package.json         Root package file
├── README.md            Project overview
├── SETUP.md             Detailed setup guide
└── INSTALLATION_CHECKLIST.md (this file)
```

## Next Steps

After successful installation:

1. ✅ Test printer connectivity
2. ✅ Verify VATSIM data loads
3. ✅ Print a test flight strip
4. 📝 Customize SVG template if needed
5. 🌐 Set up network access for remote printing
6. 🚀 Deploy to production mode

## Getting Help

If you encounter issues:

1. Check console output for error messages
2. Verify all prerequisites are installed
3. Review SETUP.md for detailed configuration
4. Check printer USB connection and drivers
5. Ensure VATSIM API is accessible from your network

## Production Deployment

When ready for production use:

```bash
# Build frontend
npm run build

# Start production server
npm start
```

Access at: http://localhost:3000

For network access, use your computer's IP address:
http://<YOUR_IP>:3000

---

**Important:** Keep the terminal window open while using the application.
The backend server must be running for the printer to function.


