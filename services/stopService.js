const pool = require("../config/db");

const getNearbyStops = async (lat, lng) => {
  const query = `
    SELECT stop_id, stop_name, lat, lng,
      ( 6371 * acos(
          cos(radians($1)) * cos(radians(lat)) *
          cos(radians(lng) - radians($2)) +
          sin(radians($1)) * sin(radians(lat))
      )) AS distance_km
    FROM stops
    ORDER BY distance_km ASC
    LIMIT 3;
  `;

  const result = await pool.query(query, [lat, lng]);
  return result.rows;
};



const getIncomingBuses = async (stop_id) => {
  const query = `
    SELECT
      t.trip_id,
      b.bus_number,
      t.current_lat,
      t.current_lng,
      next_stop.stop_name AS next_stop_name,
      -- Calculate the difference in stops as an indicator of distance
      (user_stop.sequence - next_stop.sequence) AS stops_away
    FROM Trips t
    -- Join to get the bus's route info from its schedule
    JOIN Schedules sch ON t.schedule_id = sch.schedule_id
    -- Join to get the bus's number plate
    JOIN Buses b ON t.bus_id = b.bus_id
    -- Join to get details about the bus's *next* stop
    JOIN Stops next_stop ON t.next_stop_id = next_stop.stop_id
    -- Join to get details about the *user's* current stop
    JOIN Stops user_stop ON user_stop.stop_id = $1
    WHERE
      t.status = 'in_progress'
      AND t.trip_date = CURRENT_DATE
      -- CRITICAL: Ensure the bus is on the same route and direction as the user's stop
      AND sch.route_no = user_stop.route_no
      AND sch.direction = user_stop.direction
      -- CRITICAL: Ensure the bus has not yet passed the user's stop
      AND next_stop.sequence <= user_stop.sequence
    ORDER BY
      stops_away ASC; -- Show the closest buses first
  `;

  const result = await pool.query(query, [stop_id]);
  return result.rows;
};

const searchStopRoutes = async (query) => {
    // This query correctly searches for stops by name.
    const sql = `
      SELECT stop_id, stop_name, lat, lng
      FROM stops
      WHERE stop_name ILIKE $1;
    `;
    const searchTerm = `%${query}%`;
    
    try {
      const result = await pool.query(sql, [searchTerm]);
      return result.rows;
    } catch (error) {
      console.error('Error executing searchStopRoutes query:', error);
      throw error;
    }
  };


module.exports = { getNearbyStops, getIncomingBuses,searchStopRoutes };
