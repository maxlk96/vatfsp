# VatFS - VATSIM Flight Strip Printer

A web-based flight strip printing system that uses the VATSIM data feed to display and print flight strips on a POS-5890K 58mm thermal printer.

## Features

- Real-time VATSIM flight data (auto-refresh every 15 seconds)
- Print flight strips to POS-5890K USB thermal printer
- Web interface accessible from any networked device
- Separate views for arrivals and departures
- Filter by airport ICAO code (default: ESGG)
- SVG-based flight strip template
- Modern UI with Vue 3 and Vuetify

## Measurements

This creates strips that fold along the middle, resulting in 29 x 167 mm strips (on my model)

## Prerequisites

- Node.js 18+ and npm
- POS-5890K thermal printer connected via USB

## Installation

```bash
npm run install:all
```

## Usage

### Development Mode
```bash
npm run dev
```
Access at http://localhost:5173

### Production Mode
```bash
npm run build
npm start
```
Access at http://localhost:3000

## Project Structure

- `backend/` - Express server with printer control
- `frontend/` - Vue 3 + Vuetify application
- `templates/` - SVG flight strip template

## License

MIT


