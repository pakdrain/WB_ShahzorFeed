// Load environment variables first
import { config } from 'dotenv';
config();

// Shared weight service state
export let currentWeight = '0.00';
export let currentUnit = 'kg';
export let isPortConnected = false;
export let currentComPort = process.env.DEFAULT_COM_PORT || 'COM6';
export let currentBaudRate = parseInt(process.env.DEFAULT_BAUD_RATE || '9600');

// Debug log to verify environment variable loading
console.log('Weight State Debug:', { 
  DEFAULT_COM_PORT: process.env.DEFAULT_COM_PORT, 
  currentComPort 
});

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