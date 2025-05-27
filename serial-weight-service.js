const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let currentWeight = '0.00';
let currentUnit = 'kg';
let isPortConnected = false;
let serialPort = null;

// Initialize serial port connection
async function connectToSerial() {
  try {
    serialPort = new SerialPort({
      path: 'COM3',
      baudRate: 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
    });

    const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    serialPort.on('open', () => {
      console.log('✅ Connected to COM3 weight indicator');
      isPortConnected = true;
    });

    serialPort.on('error', (err) => {
      console.error('❌ Serial port error:', err.message);
      isPortConnected = false;
    });

    serialPort.on('close', () => {
      console.log('📡 Serial port closed');
      isPortConnected = false;
    });

    // Parse incoming weight data
    parser.on('data', (data) => {
      const weightData = parseWeightData(data);
      if (weightData) {
        currentWeight = weightData.weight;
        currentUnit = weightData.unit;
        console.log(`📊 Weight: ${currentWeight} ${currentUnit}`);
      }
    });

  } catch (error) {
    console.error('❌ Failed to connect to serial port:', error.message);
    isPortConnected = false;
  }
}

// Parse weight data from serial input
function parseWeightData(rawData) {
  try {
    const data = rawData.toString().trim();
    console.log('📥 Raw data received:', data);

    // Common weight indicator formats
    // Format 1: "ST,GS,     5.00 kg" or "ST,GS,    15.25 kg"
    // Format 2: "5.00 kg" or "15.25 kg"
    // Format 3: "+0005.00kg" or "+0015.25kg"
    
    let weight = '0.00';
    let unit = 'kg';

    // Try different parsing patterns
    if (data.includes('ST,GS,')) {
      // Pattern for your Comm Operator format
      const match = data.match(/ST,GS,\s*([0-9]+\.?[0-9]*)\s*(kg|g|lb)/i);
      if (match) {
        weight = parseFloat(match[1]).toFixed(2);
        unit = match[2].toLowerCase();
      }
    } else if (data.match(/[+-]?[0-9]+\.?[0-9]*\s*(kg|g|lb)/i)) {
      // Simple format: "5.00 kg"
      const match = data.match(/([+-]?[0-9]+\.?[0-9]*)\s*(kg|g|lb)/i);
      if (match) {
        weight = parseFloat(match[1]).toFixed(2);
        unit = match[2].toLowerCase();
      }
    } else if (data.match(/[+-]?[0-9]+\.?[0-9]*kg/i)) {
      // Compact format: "+0005.00kg"
      const match = data.match(/([+-]?[0-9]+\.?[0-9]*)kg/i);
      if (match) {
        weight = parseFloat(match[1]).toFixed(2);
        unit = 'kg';
      }
    }

    return { weight, unit };
  } catch (error) {
    console.error('❌ Error parsing weight data:', error.message);
    return null;
  }
}

// API Endpoints
app.post('/api/weight/connect', (req, res) => {
  const { port, baudRate } = req.body;
  console.log(`🔌 Connecting to ${port || 'COM3'} at ${baudRate || 9600} baud...`);
  
  if (!isPortConnected) {
    connectToSerial();
  }
  
  res.json({ 
    success: true, 
    message: `Connecting to ${port || 'COM3'}`,
    connected: isPortConnected 
  });
});

app.get('/api/weight/data', (req, res) => {
  res.json({
    weight: currentWeight,
    unit: currentUnit,
    connected: isPortConnected,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/weight/tare', (req, res) => {
  if (serialPort && isPortConnected) {
    // Send tare command to scale (common commands: 'T\r\n' or 'TARE\r\n')
    serialPort.write('T\r\n');
    console.log('⚖️ Tare command sent');
    res.json({ success: true, message: 'Tare command sent' });
  } else {
    res.status(400).json({ success: false, message: 'Serial port not connected' });
  }
});

app.get('/api/weight/status', (req, res) => {
  res.json({
    connected: isPortConnected,
    port: 'COM3',
    baudRate: 9600,
    currentWeight,
    currentUnit
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Weight Serial Service running on http://localhost:${PORT}`);
  console.log(`📡 Attempting to connect to COM3...`);
  
  // Auto-connect on startup
  setTimeout(() => {
    connectToSerial();
  }, 1000);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down weight service...');
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
  }
  process.exit(0);
});