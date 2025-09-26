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

  // Optional but recommended: Filter out buses that are too far away in time
  // Keep buses if ETA is unavailable (eta_seconds is null/undefined), otherwise require < 30 minutes
  const approachingBuses = busesWithEta.filter(bus => bus.eta_seconds == null || bus.eta_seconds < 1800);

  return {
    nearest_stop: nearestStop,
    incoming_buses: approachingBuses,
  };
};

module.exports = { calculateEtaToNearestStop };