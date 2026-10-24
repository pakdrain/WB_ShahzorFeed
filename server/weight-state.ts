// Shared weight service state
export let currentWeight = "0.00";
export let currentUnit = "kg";
export let isPortConnected = false;
export let currentComPort: string = "COM1";
export let currentBaudRate: number = 9600;

// ✅ Initialize state with env (fallback to COM1/9600)
export function initializeWeightState() {
  currentComPort = process.env.DEFAULT_COM_PORT || "COM1";
  currentBaudRate = parseInt(process.env.DEFAULT_BAUD_RATE || "9600", 10);
}

// ✅ Functions to update the state
export function updateWeight(weight: string) {
  currentWeight = weight;
}

export function updateUnit(unit: string) {
  currentUnit = unit;
}

export function updateConnectionStatus(connected: boolean) {
  isPortConnected = connected;
}

export function updateComPort(port: string) {
  currentComPort = port || "COM1";
  console.log("🔄 COM port updated:", currentComPort);
}

export function updateBaudRate(rate: number) {
  currentBaudRate = rate || 9600;
  console.log("🔄 Baud rate updated:", currentBaudRate);
}
