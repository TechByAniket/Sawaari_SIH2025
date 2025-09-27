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
  // Return in-progress buses on any route/direction that includes the same physical stop (by coordinates)
  // Only include buses that have NOT yet passed that stop on their route (by sequence)
  const query = `
    WITH user_stop AS (
      SELECT lat AS u_lat, lng AS u_lng
      FROM Stops
      WHERE stop_id = $1
    )
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
    JOIN user_stop us ON TRUE
    -- Find the nearest stop to the user's coordinates on this route/direction to serve as target_seq
    JOIN LATERAL (
      SELECT 
        st.sequence AS target_seq,
        (
          6371 * acos(
            cos(radians(us.u_lat)) * cos(radians(st.lat)) *
            cos(radians(st.lng) - radians(us.u_lng)) +
            sin(radians(us.u_lat)) * sin(radians(st.lat))
          )
        ) AS target_dist_km
      FROM Stops st
      WHERE st.route_no = s.route_no AND st.direction = s.direction
      ORDER BY target_dist_km ASC
      LIMIT 1
    ) target ON TRUE
    -- Determine the bus's nearest stop along this same route/direction to infer its current sequence
    CROSS JOIN LATERAL (
      SELECT st2.sequence AS bus_seq
      FROM Stops st2
      WHERE st2.route_no = s.route_no AND st2.direction = s.direction
      ORDER BY (
        6371 * acos(
          cos(radians(t.current_lat)) * cos(radians(st2.lat)) *
          cos(radians(st2.lng) - radians(t.current_lng)) +
          sin(radians(t.current_lat)) * sin(radians(st2.lat))
        )
      ) ASC
      LIMIT 1
    ) nearest_on_route
    WHERE t.status = 'in_progress'
      AND t.trip_date = CURRENT_DATE
      -- Ensure the route truly passes near the user's stop (e.g., within 300 meters)
      AND target.target_dist_km < 0.3
      -- Include only if the bus has not yet passed the user's stop on its route
      AND nearest_on_route.bus_seq <= target.target_seq;
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
