const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const os = require('os');
const { randomBytes } = require('crypto');

class StripRenderer {
  constructor() {
    this.templateDir = path.join(__dirname, '../templates');
  }

  /**
   * Load and populate SVG template with flight data
   * @param {object} flightData - Flight information
   */
  async renderStrip(flightData) {
    try {
      // Determine which template to use
      const templateName = this.getTemplateName(flightData);
      const templatePath = path.join(this.templateDir, templateName);

      // Read SVG template
      let svgTemplate = await fs.readFile(templatePath, 'utf-8');

      // Format ATYP with WTC suffix (e.g., A320M, B738M, A388J)
      const atypWithWtc = flightData.aircraft && flightData.wtc 
        ? `${flightData.aircraft}${flightData.wtc}`
        : (flightData.aircraft || '');

      // Replace placeholders with actual data using new field names
      const replacements = {
        'CALLSIGN': flightData.callsign || '',
        'FRUL': flightData.flightRules || '',
        'ATYP': atypWithWtc,
        'WTC': flightData.wtc || '',
        'ASSR': flightData.transponder || '',
        'SID': flightData.sid || '',
        'ADEP': flightData.departure || '',
        'ADES': flightData.arrival || '',
        'RTE': this.truncateRoute(flightData.route || ''),
        'RFL': flightData.rfl || '',
        'EOBT': flightData.eobt || '',
        'TAS': flightData.tas || ''
      };

      // Perform replacements
      for (const [placeholder, value] of Object.entries(replacements)) {
        svgTemplate = svgTemplate.replace(new RegExp(placeholder, 'g'), this.escapeXml(value));
      }

      // Convert SVG to PNG and save to temp file (escpos requires file path)
      const tempFileName = `strip-${randomBytes(8).toString('hex')}.png`;
      const tempFilePath = path.join(os.tmpdir(), tempFileName);
      
      // Flight strip dimensions
      // SVG is landscape oriented, will be rotated 90° counter-clockwise
      // Before rotation: wide and short (e.g., 600x200)
      // After rotation: tall and narrow (200x600) to fit 192px width
      
      const config = require('./config');
      const paperWidth = config.printer.paperWidthPixels; // 384 pixels
      // Use 50% of paper width for strip, leaving 50% for folding (192px strip + 192px blank)
      const stripWidth = Math.floor(paperWidth * 0.50); // 192px
      
      // Render the strip at maximum usable width - printer will print it as-is on the left
      await sharp(Buffer.from(svgTemplate), {
        density: 150  // DPI for SVG rendering - controls initial size
      })
        .flatten({ background: { r: 255, g: 255, b: 255 } }) // White background
        .greyscale() // Convert to grayscale first
        .resize({ 
          width: 600,   // Resize SVG to known width first
          fit: 'contain',
          background: { r: 255, g: 255, b: 255 }
        })
        .rotate(-90) // Rotate 90° counter-clockwise (600 wide becomes 600 tall)
        .resize({
          width: stripWidth,   // ~70% width for strip content
          fit: 'contain',
          background: { r: 255, g: 255, b: 255 }
        })
        .normalise() // Increase contrast for better thermal printing
        .png({
          compressionLevel: 0,
          adaptiveFiltering: false,
          palette: true
        })
        .toFile(tempFilePath);
      
      console.log(`Strip rendered: ${stripWidth}px (50% of ${paperWidth}px paper, 50% blank for folding)`);

      return tempFilePath; // Return file path instead of buffer
    } catch (error) {
      console.error('Error rendering flight strip:', error);
      throw error;
    }
  }

  /**
   * Determine which template to use based on flight data
   * @param {object} flightData - Flight information
   * @returns {string} - Template filename
   */
  getTemplateName(flightData) {
    // Use type-specific templates if available
    if (flightData.type === 'arrival') {
      return 'striparrival.svg';
    } else if (flightData.type === 'departure') {
      return 'stripdeparture.svg';
    }
    // Default to generic strip
    return 'strip.svg';
  }

  /**
   * Truncate route to fit on strip
   */
  truncateRoute(route) {
    const maxLength = 40;
    if (route.length <= maxLength) return route;
    return route.substring(0, maxLength - 3) + '...';
  }

  /**
   * Truncate remarks to fit on strip
   */
  truncateRemarks(remarks) {
    const maxLength = 35;
    if (remarks.length <= maxLength) return remarks;
    return remarks.substring(0, maxLength - 3) + '...';
  }

  /**
   * Escape XML special characters
   */
  escapeXml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

module.exports = new StripRenderer();

