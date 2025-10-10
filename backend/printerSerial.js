const escpos = require('escpos');
const { SerialPort } = require('serialport');

/**
 * Serial Port adapter for POS-5890K printer
 * Use this if the printer appears as a COM port in Windows
 */
class SerialAdapter {
  constructor(portPath, options = {}) {
    this.portPath = portPath;
    this.options = {
      baudRate: options.baudRate || 9600,
      dataBits: options.dataBits || 8,
      stopBits: options.stopBits || 1,
      parity: options.parity || 'none'
    };
    this.port = null;
  }

  open(callback) {
    const cb = callback || function() {};
    
    try {
      this.port = new SerialPort({
        path: this.portPath,
        ...this.options,
        autoOpen: false
      });

      this.port.open((err) => {
        if (err) {
          cb(err);
        } else {
          console.log(`Serial port ${this.portPath} opened successfully`);
          cb(null);
        }
      });
    } catch (error) {
      cb(error);
    }
  }

  write(data, callback) {
    const cb = callback || function() {};
    
    if (!this.port || !this.port.isOpen) {
      cb(new Error('Serial port not open'));
      return;
    }

    this.port.write(data, (err) => {
      if (err) {
        cb(err);
      } else {
        this.port.drain(() => {
          cb(null);
        });
      }
    });
  }

  close(callback) {
    const cb = callback || function() {};
    
    if (this.port && this.port.isOpen) {
      this.port.close((err) => {
        cb(err);
      });
    } else {
      cb(null);
    }
  }
}

/**
 * Find available COM ports
 */
async function listSerialPorts() {
  const { SerialPort } = require('serialport');
  const ports = await SerialPort.list();
  
  console.log('Available COM ports:');
  ports.forEach(port => {
    console.log(`  ${port.path}:`, {
      manufacturer: port.manufacturer,
      vendorId: port.vendorId,
      productId: port.productId
    });
  });
  
  return ports;
}

class SerialPrinterController {
  constructor(comPort = 'COM3') {
    this.comPort = comPort;
    this.printer = null;
    this.isConnected = false;
  }

  /**
   * Connect to printer via serial port
   */
  async connect() {
    try {
      const adapter = new SerialAdapter(this.comPort, {
        baudRate: 9600
      });

      this.printer = new escpos.Printer(adapter);
      this.isConnected = true;

      console.log(`Connected to printer on ${this.comPort}`);
      return true;
    } catch (error) {
      console.error('Error connecting to serial printer:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Test print
   */
  async testPrint() {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.printer) {
        reject(new Error('Printer not connected'));
        return;
      }

      this.printer
        .font('a')
        .align('ct')
        .text('SERIAL PRINTER TEST')
        .text('==================')
        .text(`Port: ${this.comPort}`)
        .text(`Time: ${new Date().toLocaleString()}`)
        .feed(3)
        .cut()
        .close(() => {
          console.log('Serial test print completed');
          resolve();
        });
    });
  }

  getStatus() {
    return {
      connected: this.isConnected,
      deviceInfo: `Serial Port: ${this.comPort}`
    };
  }
}

module.exports = {
  SerialPrinterController,
  SerialAdapter,
  listSerialPorts
};


