# Setup Instructions

## Quick Start

Follow these steps to get the VATSIM Flight Strip Printer up and running.

### Step 1: Install Dependencies

Open a terminal in the project root directory and run:

```bash
npm run install:all
```

This will install dependencies for the root project, backend, and frontend.

**Note for Windows users:** The `usb` package requires build tools. If you encounter errors, install:
```bash
npm install --global windows-build-tools
```

Or install Visual Studio Build Tools manually from Microsoft.

### Step 2: Connect the Printer

1. Connect your POS-5890K printer via USB
2. Ensure the printer is powered on and has thermal paper loaded
3. Install printer drivers if required by your operating system

### Step 3: Run in Development Mode

```bash
npm run dev
```

This starts:
- Backend server on http://localhost:3000
- Frontend dev server on http://localhost:5173

Open your browser to http://localhost:5173

### Step 4: Test the Printer

1. Click the printer test button in the top-right corner
2. Verify the test strip prints successfully
3. Check the printer status indicator (should show "Connected")

### Step 5: Print Flight Strips

1. Select an airport (default: ESGG)
2. Wait for VATSIM data to load (auto-refreshes every 15 seconds)
3. Click the print button next to any flight to print its strip

## Production Deployment

### Build the Frontend

```bash
cd frontend
npm run build
```

### Start the Production Server

```bash
cd backend
npm start
```

The application will be available at http://localhost:3000

## Remote Access

To access from other devices on your network:

1. Find your computer's IP address:
   - Windows: Open PowerShell and run `ipconfig`
   - Look for "IPv4 Address" under your active network adapter

2. On other devices, open a browser to:
   - Development: `http://<YOUR_IP>:5173`
   - Production: `http://<YOUR_IP>:3000`

3. Allow firewall access if prompted

## Troubleshooting

### Printer Not Detected

- Verify USB connection
- Check Windows Device Manager for USB devices
- Try unplugging and reconnecting the printer
- Ensure printer drivers are installed

### USB Permission Issues (Linux)

```bash
sudo usermod -a -G lp $USER
sudo usermod -a -G dialout $USER
```

Log out and back in for changes to take effect.

### Build Errors on Windows

Install build tools:
```bash
npm install --global windows-build-tools
```

Or install Visual Studio Build Tools 2019 or later.

### VATSIM Data Not Loading

- Check internet connection
- Verify firewall isn't blocking outbound HTTPS requests
- Check browser console for errors

### Port Already in Use

If port 3000 or 5173 is already in use:

1. Edit `backend/config.js` to change the port
2. Edit `frontend/vite.config.js` to change the dev server port

## Configuration

### Change Default Airport

Edit `backend/config.js`:
```javascript
defaultAirport: 'ESGG',  // Change to your airport
```

### Customize Flight Strip Template

Edit `templates/flight-strip.svg` to modify the strip layout.

### Adjust Auto-Refresh Interval

Edit `backend/config.js`:
```javascript
refreshInterval: 15000,  // milliseconds (15 seconds)
```

And `frontend/src/App.vue` (line ~130):
```javascript
}, 15000);  // milliseconds
```

## Next Steps

- Customize the SVG template for your needs
- Add more common airports to the quick select
- Configure your firewall for network access
- Set up the application to start on system boot

Enjoy your VATSIM Flight Strip Printer!


