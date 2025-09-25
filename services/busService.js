const pool = require("../config/db");

// GET /buses/search?query=andh
async function searchBusRoutes(query) {
  const sql = `
    SELECT route_no, source, destination
    FROM routes
    WHERE source ILIKE $1 OR destination ILIKE $1 OR route_no ILIKE $1;
  `;
  // Note: I removed ::TEXT from route_no as it's already a VARCHAR
  const searchTerm = `%${query}%`;
  
  try {
    const result = await pool.query(sql, [searchTerm]);
    return result.rows;
  } catch (error) {
    console.error('Error executing searchBusRoutes query:', error);
    throw error;
  }
}

// Corrected getActiveBusesByRoute function
const getActiveBusesByRoute = async (route_no, direction) => {
  let query = `
    SELECT
      t.bus_id,
      t.current_lat AS lat,
      t.current_lng AS lng,
      t.status,
      s.route_no,
      s.direction
    FROM Trips AS t
    JOIN Schedules AS s ON t.schedule_id = s.schedule_id
    WHERE s.route_no = $1
      AND t.status = 'in_progress'
      AND t.trip_date = CURRENT_DATE
  `;
  const params = [route_no];

  if (direction) {
    query += " AND s.direction = $2";
    params.push(direction);
  }

  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
      console.error('Error executing getActiveBusesByRoute query:', error);
      throw error;
  }
};

// Corrected function (renamed for clarity)
async function getAllActiveTrips() {
  const sql = `
    SELECT
      t.trip_id,
      t.status,
      t.current_lat,
      t.current_lng,
      b.bus_number,
      s.route_no,
      s.direction
    FROM Trips AS t
    JOIN Buses AS b ON t.bus_id = b.bus_id
    JOIN Schedules AS s ON t.schedule_id = s.schedule_id
    WHERE t.status = 'in_progress' AND t.trip_date = CURRENT_DATE;
  `;
  try {
    const result = await pool.query(sql);
    return result.rows;
  } catch (error) {
    console.error('Error executing getAllActiveTrips query:', error);
    throw error;
  }
}

const getBusLiveLocation = async (bus_id) => {
  const query = `
    SELECT t.trip_id, b.bus_id, b.bus_number,
           t.current_lat, t.current_lng, t.status, t.last_updated_at
    FROM trips t
    JOIN buses b ON t.bus_id = b.bus_id
    WHERE b.bus_id = $1
      AND t.status = 'in_progress'
    ORDER BY t.last_updated_at DESC
    LIMIT 1;
  `;
  const result = await pool.query(query, [bus_id]);
  return result.rows[0] || null;
};



// Updates the location for an active trip in the database
// In busService.js
const updateBusLocation = async (bus_id, lat, lng) => {
  const today = new Date().toISOString().split('T')[0];

  // --- TEMPORARY DEBUGGING CODE ---
  // Let's first SELECT the trip to see what the database returns
  try {
    const checkQuery = `SELECT * FROM Trips WHERE bus_id = $1`;
    const checkResult = await pool.query(checkQuery, [bus_id]);
    
    console.log('--- DB CHECK ---');
    console.log('Found trip data for bus:', checkResult.rows[0]); // This is the most important log!
    console.log('----------------');
  } catch (e) {
    console.error('Error during the check query:', e);
  }
  // --- END OF DEBUGGING CODE ---


  // This is the original UPDATE query
  const query = `
    UPDATE Trips
    SET
      current_lat = $1,
      current_lng = $2,
      last_updated_at = NOW()
    WHERE
      bus_id = $3
      AND status = 'in_progress'
      AND trip_date = $4
    RETURNING *;
  `;

  const result = await pool.query(query, [lat, lng, bus_id, today]);
  return result.rows[0] || null;
};

// Don't forget to export the correct functions
module.exports = { 
  getActiveBusesByRoute, 
  searchBusRoutes, // Assuming this is also in your file
  getAllActiveTrips, // Use the new function name
  getBusLiveLocation,
  updateBusLocation
};