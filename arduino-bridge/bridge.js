// Serial Bridge between Arduino and Web App
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { SerialPortStream } = require('@serialport/stream');
const { autoDetect } = require('@serialport/bindings-cpp');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Create Express server
const app = express();
app.use(cors());
app.use(express.json());

// Track button state
let buttonState = 'released';
let port = null;
let parser = null;
let isConnected = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000; // 3 seconds

// Create logs directory if it doesn't exist
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// Log function
function log(message, isError = false) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  
  fs.appendFile(
    path.join(LOG_DIR, isError ? 'error.log' : 'bridge.log'), 
    logMessage, 
    (err) => {
      if (err) console.error('Error writing to log file:', err);
    }
  );
}

// Function to find available Arduino ports
async function findArduinoPorts() {
  try {
    const Binding = autoDetect();
    const ports = await Binding.list();
    return ports.filter(port => {
      // Filter for common Arduino identifiers
      return (
        (port.manufacturer && port.manufacturer.toLowerCase().includes('arduino')) ||
        (port.vendorId && port.productId) // Most Arduinos have vendor and product IDs
      );
    });
  } catch (error) {
    log(`Error finding ports: ${error.message}`, true);
    return [];
  }
}

// Connect to Arduino
async function connectToArduino() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    log(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Please restart the application.`, true);
    return;
  }

  try {
    // Close existing connection if any
    if (port && port.isOpen) {
      await port.close();
    }
    
    // Try to find Arduino ports
    const arduinoPorts = await findArduinoPorts();
    log(`Found ${arduinoPorts.length} potential Arduino ports`);
    
    let portPath = null;
    
    if (arduinoPorts.length > 0) {
      // Use the first Arduino port found
      portPath = arduinoPorts[0].path;
      log(`Auto-detected Arduino on port: ${portPath}`);
    } else {
      // Fallback to common port names if auto-detection fails
      const commonPorts = process.platform === 'win32' 
        ? ['COM3', 'COM4', 'COM5', 'COM6'] 
        : ['/dev/ttyACM0', '/dev/ttyUSB0', '/dev/cu.usbmodem14201'];
      
      portPath = commonPorts[reconnectAttempts % commonPorts.length];
      log(`No Arduino detected. Trying common port: ${portPath}`);
    }
    
    // Connect to the selected port
    port = new SerialPort({ path: portPath, baudRate: 9600 });
    
    // Set up parser
    parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    
    // Set up event handlers
    parser.on('data', handleArduinoData);
    port.on('error', handlePortError);
    port.on('open', handlePortOpen);
    port.on('close', handlePortClose);
    
    reconnectAttempts++;
  } catch (error) {
    log(`Connection error: ${error.message}`, true);
    scheduleReconnect();
  }
}

// Handle data from Arduino
function handleArduinoData(data) {
  log(`Arduino says: ${data}`);
  
  if (data === 'BUTTON_PRESSED') {
    buttonState = 'pressed';
    log('Button was pressed!');
  } else if (data === 'BUTTON_RELEASED') {
    buttonState = 'released';
    log('Button was released');
  } else if (data === 'Arduino ready') {
    log('Arduino is ready and connected');
  }
}

// Handle port errors
function handlePortError(err) {
  log(`Serial port error: ${err.message}`, true);
  isConnected = false;
  scheduleReconnect();
}

// Handle port opening
function handlePortOpen() {
  log(`Connected to Arduino on ${port.path}`);
  isConnected = true;
  reconnectAttempts = 0; // Reset counter on successful connection
}

// Handle port closing
function handlePortClose() {
  log('Serial port closed');
  isConnected = false;
  scheduleReconnect();
}

// Schedule reconnection
function scheduleReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  
  log(`Scheduling reconnection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_DELAY}ms`);
  reconnectTimer = setTimeout(connectToArduino, RECONNECT_DELAY);
}

// API endpoint to get button state
app.get('/button-state', (req, res) => {
  res.json({ 
    state: buttonState,
    arduinoConnected: isConnected
  });
  
  // Reset button state after it's been read
  if (buttonState === 'pressed') {
    buttonState = 'released';
  }
});

// Add a test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    status: 'Bridge server is running',
    arduino: isConnected ? 'connected' : 'disconnected',
    port: isConnected ? port.path : 'none'
  });
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    arduino: isConnected ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    reconnectAttempts
  });
});

// Start server
const PORT = 3001; // Different from your main app (3000)
app.listen(PORT, () => {
  log(`Arduino bridge running on http://localhost:${PORT}`);
  // Start connection attempt
  connectToArduino();
});

// Process termination handling
process.on('SIGINT', () => {
  log('Closing serial port and exiting...');
  if (port && port.isOpen) {
    port.close();
  }
  process.exit(0);
}); 