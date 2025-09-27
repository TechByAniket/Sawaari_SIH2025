const pool = require('../config/db');
const axios = require('axios');
const stopService = require('./stopService');

// This is a new, more robust function to get buses.
const getIncomingBusesByRouteNo = async (route_no) => {
  const query = `
    SELECT
      t.trip_id,
      t.bus_id,
      t.current_lat,
      t.current_lng,
      b.bus_number
    FROM Trips t
    JOIN Schedules s ON t.schedule_id = s.schedule_id
    JOIN Buses b ON t.bus_id = b.bus_id
    WHERE
      t.status = 'in_progress'
      AND t.trip_date = CURRENT_DATE
      -- The key change: We only match the route number, not the direction.
      AND s.route_no = $1;
  `;
  const result = await pool.query(query, [route_no]);
  return result.rows;
};

const calculateEtaToNearestStop = async (userLat, userLng) => {
  // 1. Find the user's nearest stop (no change here)
  const nearbyStops = await stopService.getNearbyStops(userLat, userLng);
  if (nearbyStops.length === 0) {
    return { message: "No nearby stops found." };
  }
  const nearestStop = nearbyStops[0];

  // 2. Find all buses on that route number (using our new function)
  // Use stop_id to fetch incoming buses for the same route and direction as the nearest stop
  const incomingBuses = await stopService.getIncomingBuses(nearestStop.stop_id);
  if (incomingBuses.length === 0) {
    return {
      nearest_stop: nearestStop,
      incoming_buses: []
    };
  }

  // 3. For each bus, get the ETA from OSRM (no change here)
  const etaPromises = incomingBuses.map(async (bus) => {
    try {
      const origin = `${bus.current_lng},${bus.current_lat}`;
      const destination = `${nearestStop.lng},${nearestStop.lat}`;
      const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${origin};${destination}`;
      
      const response = await axios.get(osrmUrl);
      const etaSeconds = response.data.routes[0].duration;
      const etaMinutes = Math.round(etaSeconds / 60);

      return {
        ...bus,
        eta_seconds: etaSeconds,
        eta_text: `${etaMinutes} mins`,
      };
    } catch (error) {
      console.error("OSRM API Error:", error.message);
      return { ...bus, eta_text: "ETA unavailable" };
    }
  });

  const busesWithEta = await Promise.all(etaPromises);

  // Include all buses that will pass through the user's stop.
  // Sort by ETA when available (undefined/null ETAs go to the end)
  const sorted = busesWithEta.sort((a, b) => {
    const ea = a.eta_seconds;
    const eb = b.eta_seconds;
    if (ea == null && eb == null) return 0;
    if (ea == null) return 1;
    if (eb == null) return -1;
    return ea - eb;
  });

  return {
    nearest_stop: nearestStop,
    incoming_buses: sorted,
  };
};

module.exports = { calculateEtaToNearestStop }; 



// const pool = require('../config/db');
// const axios = require('axios');
// const stopService = require('./stopService'); // Ensure this path is correct

// // --- 1. PASTE YOUR TOMTOM API KEY HERE ---
// const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

// // This is the main function that calculates the ETA
// const calculateEtaToNearestStop = async (userLat, userLng) => {
//   // a. Find the user's nearest stop (no changes here)
//   const nearbyStops = await stopService.getNearbyStops(userLat, userLng);
//   if (nearbyStops.length === 0) {
//     return { message: "No nearby stops found." };
//   }
//   const nearestStop = nearbyStops[0];

//   // b. Find all active buses on that stop's route
//   const incomingBuses = await getIncomingBusesByRouteNo(nearestStop.route_no);
//   if (incomingBuses.length === 0) {
//     return {
//       nearest_stop: nearestStop,
//       incoming_buses: []
//     };
//   }

//   // c. For each bus, get the ETA from the TomTom Routing API
//   const etaPromises = incomingBuses.map(async (bus) => {
//     try {
//       // TomTom requires locations in the format: lat,lng:lat,lng
//       const locations = `${bus.current_lat},${bus.current_lng}:${nearestStop.lat},${nearestStop.lng}`;
      
//       const tomtomUrl = `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?key=${TOMTOM_API_KEY}`;

//       const response = await axios.get(tomtomUrl);
      
//       // The ETA is in the 'travelTimeInSeconds' field of the response
//       const etaSeconds = response.data.routes[0].summary.travelTimeInSeconds;
//       const etaMinutes = Math.round(etaSeconds / 60);

//       return {
//         ...bus,
//         eta_seconds: etaSeconds,
//         eta_text: `${etaMinutes} mins`,
//       };
//     } catch (error) {
//       console.error("TomTom API Error:", error.response ? error.response.data : error.message);
//       return { ...bus, eta_text: "ETA unavailable" };
//     }
//   });

//   const busesWithEta = await Promise.all(etaPromises);
  
//   // d. Filter out buses that are too far away in time (e.g., more than 30 mins)
//   const approachingBuses = busesWithEta.filter(bus => bus.eta_seconds < 1800);

//   return {
//     nearest_stop: nearestStop,
//     incoming_buses: approachingBuses,
//   };
// };


// // This is the helper function that finds active buses on a route
// const getIncomingBusesByRouteNo = async (route_no) => {
//   const query = `
//     SELECT t.trip_id, t.bus_id, t.current_lat, t.current_lng, b.bus_number
//     FROM Trips t
//     JOIN Schedules s ON t.schedule_id = s.schedule_id
//     JOIN Buses b ON t.bus_id = b.bus_id
//     WHERE t.status = 'in_progress'
//       AND t.trip_date = CURRENT_DATE
//       AND s.route_no = $1;
//   `;
//   const result = await pool.query(query, [route_no]);
//   return result.rows;
// };


// module.exports = { calculateEtaToNearestStop };