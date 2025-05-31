// Shared weight service state
export let currentWeight = '0.00';
export let currentUnit = 'kg';
export let isPortConnected = false;
export let currentComPort = 'COM6'; // Default value, will be updated on initialization
export let currentBaudRate = 9600;



// Functions to update the state
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
  currentComPort = port;
}

export function updateBaudRate(rate: number) {
  currentBaudRate = rate;
}