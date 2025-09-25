const axios = require('axios');

// --- CONFIGURATION ---
const BUS_ID_TO_SIMULATE = 101;
const UPDATE_INTERVAL_MS = 10000; // 10 seconds
const API_ENDPOINT = `http://localhost:3000/buses/${BUS_ID_TO_SIMULATE}/location`;

// Starting location
let currentLat = 19.059400;
let currentLng = 72.833500;

console.log(`Starting simulation for Bus ID: ${BUS_ID_TO_SIMULATE}`);
console.log(`Sending updates to ${API_ENDPOINT} every ${UPDATE_INTERVAL_MS / 1000} seconds.`);

const sendLocationUpdate = async () => {
  // Simulate movement
  currentLat += 0.0005;
  currentLng += 0.0005;

  const newLocation = {
    lat: currentLat.toFixed(6),
    lng: currentLng.toFixed(6),
  };

  try {
    const response = await axios.put(API_ENDPOINT, newLocation);
    console.log(`[${new Date().toLocaleTimeString()}] Update sent. Server says: "${response.data.message}"`);
  } catch (error) {
    const errorMessage = error.response ? error.response.data.message : error.message;
    console.error(`[${new Date().toLocaleTimeString()}] Error: ${errorMessage}`);
  }
};

setInterval(sendLocationUpdate, UPDATE_INTERVAL_MS);