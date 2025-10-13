const escpos = require('escpos');
const usb = require('usb');
const config = require('./config');

// Custom USB adapter to work around escpos-usb compatibility issues
class USBAdapter {
  constructor(device) {
    this.device = device;
    this.endpoint = null;
    this.interface = null;
  }

  open(callback) {
    const cb = callback || function() {};
    
    try {
      this.device.open();
      
      // Try each interface to find one with an OUT endpoint
      let foundEndpoint = false;
      const interfaceCount = this.device.interfaces.length;
      
      console.log(`Device has ${interfaceCount} interface(s)`);
      
      for (let i = 0; i < interfaceCount && !foundEndpoint; i++) {
        try {
          this.interface = this.device.interface(i);
          
          console.log(`Checking interface ${i}:`);
          console.log(`  - Endpoints: ${this.interface.endpoints.length}`);
          
          // Log all endpoints for debugging
          this.interface.endpoints.forEach((ep, idx) => {
            console.log(`  - Endpoint ${idx}: direction=${ep.direction}, type=${ep.transferType}, address=0x${ep.address.toString(16)}`);
          });
          
          // Detach kernel driver if necessary (Linux only)
          if (process.platform !== 'win32') {
            try {
              if (this.interface.isKernelDriverActive()) {
                this.interface.detachKernelDriver();
              }
            } catch (e) {
              // Ignore
            }
          }
          
          this.interface.claim();
          
          // Find the OUT endpoint (bulk or interrupt transfer type)
          // Transfer type: 2 = BULK, 3 = INTERRUPT
          this.endpoint = this.interface.endpoints.find(e => 
            e.direction === 'out' && (e.transferType === 2 || e.transferType === 3)
          );
          
          if (this.endpoint) {
            foundEndpoint = true;
            console.log(`✓ USB endpoint configured successfully on interface ${i}`);
            console.log(`  Endpoint address: 0x${this.endpoint.address.toString(16)}, type: ${this.endpoint.transferType}`);
          } else {
            // Release this interface and try next
            console.log(`  No suitable OUT endpoint found on interface ${i}`);
            try {
              this.interface.release();
            } catch (e) {
              // Ignore
            }
          }
        } catch (interfaceError) {
          console.log(`Interface ${i} error:`, interfaceError.message);
        }
      }
      
      if (!foundEndpoint) {
        cb(new Error('No OUT endpoint found on any interface'));
        return;
      }
      
      cb(null);
    } catch (error) {
      cb(error);
    }
  }

  write(data, callback) {
    const cb = callback || function() {};
    
    if (!this.endpoint) {
      cb(new Error('Device not open'));
      return;
    }
    
    try {
      this.endpoint.transfer(Buffer.from(data), (error) => {
        if (error) {
          cb(error);
        } else {
          cb(null);
        }
      });
    } catch (error) {
      cb(error);
    }
  }

  close(callback) {
    const cb = callback || function() {};
    
    try {
      // Actually close the connection to release USB device
      this.forceClose();
      cb(null);
    } catch (error) {
      cb(error);
    }
  }

  // Actually close the device
  forceClose() {
    try {
      if (this.interface) {
        try {
          this.interface.release(true, (err) => {
            if (err) console.log('Interface release:', err.message);
          });
        } catch (e) {
          // Ignore
        }
      }
      if (this.device) {
        try {
          this.device.close();
          console.log('USB device closed');
        } catch (e) {
          console.log('Device close error:', e.message);
        }
      }
    } catch (error) {
      // Ignore
    }
  }
}

class PrinterController {
  constructor() {
    this.printer = null;
    this.device = null;
    this.isConnected = false;
    this.adapter = null;
  }

  /**
   * Reset USB connection (close and reconnect)
   */
  async resetConnection() {
    console.log('Resetting USB connection...');
    
    // Force close existing connection
    if (this.adapter) {
      try {
        this.adapter.forceClose();
      } catch (e) {
        // Ignore
      }
    }
    
    this.printer = null;
    this.device = null;
    this.adapter = null;
    this.isConnected = false;
    
    // Wait longer for USB to fully release and reinitialize
    return new Promise(resolve => {
      setTimeout(() => {
        const connected = this.connect();
        if (connected) {
          // Send ESC/POS reset command to clear printer state
          setTimeout(() => {
            if (this.adapter) {
              const resetCmd = Buffer.from([0x1B, 0x40]); // ESC @ (Initialize printer)
              this.adapter.write(resetCmd, () => {
                console.log('Printer reinitialized after reset');
                resolve(connected);
              });
            } else {
              resolve(connected);
            }
          }, 100);
        } else {
          resolve(connected);
        }
      }, 800); // Longer delay for complete USB reset
    });
  }

  /**
   * Find thermal printers
   */
  findPrinters() {
    const devices = usb.getDeviceList();
    
    // Your POS-5890K printer - CORRECT IDs
    const targetPrinter = {
      vendor: 0x0416,  // 1046 decimal
      product: 0x5011  // 20497 decimal
    };
    
    // Log all USB devices for debugging
    console.log(`\nScanning ${devices.length} USB devices:`);
    devices.forEach(device => {
      const desc = device.deviceDescriptor;
      const isPOS5890K = desc.idVendor === 0x0416 && desc.idProduct === 0x5011;
      const deviceName = isPOS5890K ? ' ← POS-5890K THERMAL PRINTER' : '';
      console.log(`  ${desc.idVendor}:${desc.idProduct} (0x${desc.idVendor.toString(16)}:0x${desc.idProduct.toString(16)})${deviceName}`);
    });
    
    // First, try to find the specific POS-5890K printer (PRIORITY)
    const specificPrinter = devices.find(device => {
      const desc = device.deviceDescriptor;
      return desc.idVendor === targetPrinter.vendor && desc.idProduct === targetPrinter.product;
    });
    
    if (specificPrinter) {
      console.log('✓ Selected: POS-5890K thermal printer (1046:20497)\n');
      return [specificPrinter];
    }
    
    // Fallback to any printer (NOT RECOMMENDED - may select wrong device)
    const printerVendors = [0x0416, 0x04b8, 0x0519]; // Only known printer vendors
    const found = devices.filter(device => {
      const desc = device.deviceDescriptor;
      return printerVendors.includes(desc.idVendor) || desc.bDeviceClass === 7;
    });
    
    if (found.length > 0) {
      console.log(`⚠ No POS-5890K found. Trying ${found.length} fallback device(s):`);
      found.forEach(device => {
        const desc = device.deviceDescriptor;
        console.log(`  Fallback: ${desc.idVendor}:${desc.idProduct}`);
      });
      console.log('');
    } else {
      console.log('✗ No thermal printer found!\n');
    }
    
    return found;
  }

  /**
   * Initialize printer connection
   */
  connect() {
    try {
      // Find printer devices
      const printers = this.findPrinters();
      
      if (printers.length === 0) {
        console.warn('No USB thermal printer found');
        this.isConnected = false;
        return false;
      }

      // Use first available printer
      this.device = printers[0];
      console.log('Found printer device:', {
        vendor: this.device.deviceDescriptor.idVendor,
        product: this.device.deviceDescriptor.idProduct
      });
      
      // Create custom USB adapter
      this.adapter = new USBAdapter(this.device);
      
      // Open the adapter to initialize USB connection (synchronous error handling)
      let openSuccess = false;
      this.adapter.open((openError) => {
        if (openError) {
          console.error('Failed to open USB connection:', openError);
          this.isConnected = false;
          this.printer = null;
          
          // If error is ACCESS or NOT_SUPPORTED, suggest reset
          if (openError.errno === -3 || openError.errno === -12) {
            console.log('USB device may be locked - will reset on next print attempt');
          }
        } else {
          console.log('USB connection opened successfully');
          openSuccess = true;
          
          // Create printer instance only if connection succeeded
          this.printer = new escpos.Printer(this.adapter);
          this.isConnected = true;
          
          console.log('Printer connected successfully');
          
          // Try to initialize printer with ESC/POS init command (optional - may fail with INTERRUPT endpoints)
          const initCmd = Buffer.from([0x1B, 0x40]); // ESC @ (Initialize printer)
          this.adapter.write(initCmd, (writeError) => {
            if (writeError) {
              console.log('Note: Printer initialization skipped (normal for some USB modes)');
              // Not a critical error - printer may work fine without explicit init
            } else {
              console.log('Printer initialized with ESC/POS commands');
            }
          });
        }
      });
      
      return openSuccess;
    } catch (error) {
      console.error('Error connecting to printer:', error.message);
      this.isConnected = false;
      this.printer = null;
      return false;
    }
  }

  /**
   * Print flight strip image
   * @param {string} imagePath - Path to image file
   */
  async printImage(imagePath) {
    const fs = require('fs');
    
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.isConnected || !this.printer) {
          console.log('Printer not connected, attempting reset...');
          const connected = await this.resetConnection();
          if (!connected) {
            reject(new Error('Printer not connected after reset'));
            return;
          }
        }

        console.log('Printing image strip from:', imagePath);

        // Load image from file path
        escpos.Image.load(imagePath, (image) => {
          // Note: escpos.Image.load doesn't use standard (error, result) callback
          // It just returns the image object directly
          
          if (!image || !image.data) {
            console.error('Failed to load image');
            reject(new Error('Failed to load image'));
            return;
          }

          try {
            console.log(`Image loaded: ${image.size.width}x${image.size.height}`);
            console.log(`Image data available: ${!!image.data}`);
            
            // Use left alignment to prevent centering/stretching
            this.printer.align('lt');
            
            // Use raster mode which doesn't auto-scale
            console.log('Printing with raster (no auto-scale)...');
            this.printer
              .raster(image, 'normal')
              .feed(2)
              .cut();
            
            // MUST close to flush data, but use setTimeout to let raster queue first
            setTimeout(() => {
              this.printer.close((err) => {
                // Errors are expected and harmless - data still transmits
                if (err && !err.message.includes("pending request")) {
                  console.warn('Close warning:', err.message);
                }
                
                // Clean up temp file
                fs.unlink(imagePath, (unlinkError) => {
                  if (unlinkError) {
                    console.warn('Failed to delete temp file:', unlinkError.message);
                  }
                });
                
                console.log('✓ Image strip sent to printer');
                
                // Mark disconnected so next print reconnects fresh
                this.isConnected = false;
                this.printer = null;
                
                resolve();
              });
            }, 500); // Short delay to let raster() queue data before close flushes it
          } catch (printError) {
            console.error('Error during image print:', printError);
            reject(printError);
          }
        });
      } catch (error) {
        console.error('Error in printImage:', error);
        reject(error);
      }
    });
  }

  /**
   * Print text-only flight strip (fallback)
   * @param {object} flightData - Flight information
   */
  async printText(flightData) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.isConnected || !this.printer) {
          console.log('Printer not connected, attempting reset...');
          const connected = await this.resetConnection();
          if (!connected) {
            reject(new Error('Printer not connected after reset'));
            return;
          }
        }

        console.log('Printing flight strip for:', flightData.callsign || 'BLANK');

        try {
          const stripType = flightData.type === 'arrival' ? 'ARR' : 'DEP';
          
          // Format aircraft with WTC
          const aircraft = flightData.aircraft || flightData.ATYP || '';
          const wtc = flightData.wtc || flightData.WTC || '';
          const aircraftWithWtc = aircraft && wtc ? `${aircraft}${wtc}` : aircraft;
          
          // Hide squawk 2000 (standard VFR code)
          const squawk = flightData.transponder || flightData.ASSR || '';
          const displaySquawk = squawk === '2000' ? '' : (squawk || 'N/A');
          
          this.printer
            .font('a')
            .align('ct')
            .size(1, 1)
            .style('bu')
            .text(flightData.callsign || '        ')
            .style('normal')
            .text('')
            .text('========================')
            .align('lt')
            .text(`Type: ${stripType}  Rules: ${flightData.flightRules || flightData.FRUL || ''}`)
            .text(`A/C:  ${aircraftWithWtc}`)
            .text(`Sqwk: ${displaySquawk}`)
            .text(`From: ${flightData.departure || flightData.ADEP || ''}`)
            .text(`To:   ${flightData.arrival || flightData.ADES || ''}`)
            .text(`RFL:  ${flightData.rfl || flightData.RFL || flightData.altitude || ''}`)
          
          // Show EOBT and TAS if available
          if (flightData.eobt || flightData.EOBT) {
            this.printer.text(`EOBT: ${flightData.eobt || flightData.EOBT || ''}`);
          }
          if (flightData.tas || flightData.TAS) {
            this.printer.text(`TAS:  ${flightData.tas || flightData.TAS || ''}`);
          }
          
          // Only show SID for departures
          if (stripType === 'DEP' && (flightData.sid || flightData.SID)) {
            this.printer.text(`SID:  ${flightData.sid || flightData.SID || ''}`);
          }
          
          this.printer
            .text('------------------------')
            .text('Route:')
            .text(this.wrapText(flightData.route || flightData.RTE || 'DCT', 32))
            .text('========================')
            .text(`Printed: ${new Date().toLocaleTimeString()}`)
            .feed(3)
            .cut()
            .close(() => {
              // Ignore close errors
              console.log('✓ Flight strip printed for', flightData.callsign || 'BLANK');
              resolve();
            });
        } catch (printError) {
          console.error('Error during text print:', printError);
          reject(printError);
        }
      } catch (error) {
        console.error('Error in printText:', error);
        reject(error);
      }
    });
  }

  /**
   * Wrap text to fit printer width
   */
  wrapText(text, maxLength = 32) {
    if (!text || text.length <= maxLength) return text;
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    
    return lines.join('\n');
  }

  /**
   * Get printer status
   */
  getStatus() {
    // Check if device exists and can be accessed
    // A device may exist even if we reset connection after printing
    const hasDevice = !!this.device || this.findPrinters().length > 0;
    
    return {
      connected: hasDevice,
      deviceInfo: this.device ? `USB Thermal Printer (${this.device.deviceDescriptor.idVendor}:${this.device.deviceDescriptor.idProduct})` : 'No device'
    };
  }

  /**
   * Test printer with a simple print
   */
  async testPrint() {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isConnected || !this.printer) {
          console.log('Connecting to printer for test...');
          const connected = this.connect();
          if (!connected) {
            reject(new Error('Printer not connected'));
            return;
          }
        }

        console.log('Sending test print...');
        
        this.printer
          .font('a')
          .align('ct')
          .size(1, 1)
          .style('bu')
          .text('PRINTER TEST')
          .style('normal')
          .text('==================')
          .text('POS-5890K Thermal Printer')
          .text('VATSIM Flight Strips')
          .text('==================')
          .text(`Time: ${new Date().toLocaleString()}`)
          .feed(3)
          .cut()
          .close(() => {
            // Ignore close errors
            console.log('Test print sent to printer');
            resolve();
          });
      } catch (error) {
        console.error('Error in testPrint:', error);
        reject(error);
      }
    });
  }
}

module.exports = new PrinterController();

