const axios = require('axios');

// --- 1. IMPORT ROUTE DATA ---
// The large allRoutes object is now loaded from a separate file.
const { allRoutes } = require('./dummyData/allRoutes.js');

// --- 2. SIMULATOR CONFIGURATION ---
const UPDATE_INTERVAL_MS = 5000; // 10 seconds
const API_BASE_URL = 'http://localhost:3000';

// This object will keep track of the state of each bus we are simulating.
let trackedBuses = {};
// trackedBuses will look like:
// { '101': { trip_id: 1, route: '18AC', direction: 'UP', coordinateIndex: 5 },
//   '102': { trip_id: 2, route: '9AC', direction: 'UP', coordinateIndex: 2 } }


// --- 3. THE MAIN SIMULATION LOOP ---
const runSimulationCycle = async () => {
  try {
    // a. Fetch all currently active trips from our server
    const response = await axios.get(`${API_BASE_URL}/trips/active`);
    const activeTrips = response.data;

    // b. Update our list of tracked buses
    updateTrackedBuses(activeTrips);

    // c. Send a location update for each tracked bus
    for (const busId in trackedBuses) {
      await sendLocationUpdate(busId);
    }

  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Simulation cycle failed:`, error.message);
  }
};

// This function keeps our `trackedBuses` object in sync with the database
const updateTrackedBuses = (activeTrips) => {
  const activeBusIds = new Set();
  
  for (const trip of activeTrips) {
    activeBusIds.add(trip.bus_id.toString());
    // If this is a new bus that we haven't seen before, add it to our tracker.
    if (!trackedBuses[trip.bus_id]) {
      console.log(`[${new Date().toLocaleTimeString()}] New trip detected! Starting simulation for Bus ID: ${trip.bus_id} on Route: ${trip.route_no}`);
      trackedBuses[trip.bus_id] = {
        trip_id: trip.trip_id,
        route: trip.route_no,
        direction: trip.direction, // We will need 'DOWN' direction data later
        coordinateIndex: 0
      };
    }
  }

  // Remove any buses from our tracker that are no longer active
  for (const busId in trackedBuses) {
    if (!activeBusIds.has(busId)) {
      console.log(`[${new Date().toLocaleTimeString()}] Trip for Bus ID: ${busId} is no longer active. Stopping simulation.`);
      delete trackedBuses[busId];
    }
  }
};


const sendLocationUpdate = async (busId) => {
  const bus = trackedBuses[busId];
  const routeData = allRoutes[bus.route];

  if (!routeData) {
    console.warn(`Warning: No coordinate data found for route "${bus.route}". Skipping update for Bus ID: ${busId}.`);
    return;
  }
  
  // If the bus reaches the end of its route, reset it.
  if (bus.coordinateIndex >= routeData.length) {
    console.log(`[${new Date().toLocaleTimeString()}] Bus ID: ${busId} reached the end of its route. Resetting.`);
    bus.coordinateIndex = 0;
  }

  const currentStop = routeData[bus.coordinateIndex];
  const locationPayload = {
    lat: currentStop.lat,
    lng: currentStop.lng
  };

  try {
    const apiEndpoint = `${API_BASE_URL}/buses/${busId}/location`;
    await axios.put(apiEndpoint, locationPayload);
    console.log(`[${new Date().toLocaleTimeString()}] Bus ID ${busId}: Location updated to ${currentStop.stop_name}`);
    
    // Move to the next coordinate for the next cycle
    bus.coordinateIndex++;

  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Error updating location for Bus ID ${busId}:`, error.message);
  }
};


// --- 4. START THE SIMULATOR ---
console.log("🚀 Dynamic Bus Simulator started. Waiting for active trips...");
setInterval(runSimulationCycle, UPDATE_INTERVAL_MS);