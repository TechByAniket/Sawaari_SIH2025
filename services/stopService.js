const pool = require("../config/db");

const getNearbyStops = async (lat, lng) => {
  const query = `
    SELECT stop_id, stop_name, lat, lng, route_no, direction,
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
  // This query finds ALL active buses on the same route as the user's stop.
  // It does NOT depend on a 'next_stop_id'.
  const query = `
    SELECT
      t.trip_id,
      t.bus_id,
      t.current_lat,
      t.current_lng,
      b.bus_number,
      s.route_no,
      s.direction
    FROM Trips t
    JOIN Schedules s ON t.schedule_id = s.schedule_id
    JOIN Buses b ON t.bus_id = b.bus_id
    -- Find the route information for the user's chosen stop
    JOIN Stops user_stop ON user_stop.stop_id = $1
    WHERE
      t.status = 'in_progress'
      AND t.trip_date = CURRENT_DATE
      -- Include buses whose route includes the same physical stop (by proximity),
      -- OR as a fallback, buses currently within ~3km of the user's stop
      AND (
        EXISTS (
          SELECT 1
          FROM Stops st
          WHERE st.route_no = s.route_no
            AND ABS(st.lat - user_stop.lat) < 0.001
            AND ABS(st.lng - user_stop.lng) < 0.001
        )
        OR (
          6371 * acos(
            cos(radians(user_stop.lat)) * cos(radians(t.current_lat)) *
            cos(radians(t.current_lng) - radians(user_stop.lng)) +
            sin(radians(user_stop.lat)) * sin(radians(t.current_lat))
          ) < 3
        )
      );
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
