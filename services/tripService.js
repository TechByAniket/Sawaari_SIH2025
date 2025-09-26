const pool = require('../config/db');

const startTrip = async (schedule_id, bus_id) => {
  const today = new Date().toISOString().split('T')[0];

  // This query finds the starting coordinates and inserts the new trip.
  const query = `
    WITH starting_stop AS (
      SELECT st.lat, st.lng
      FROM Schedules s
      JOIN Stops st ON s.route_no = st.route_no AND s.direction = st.direction
      WHERE s.schedule_id = $1 AND st.sequence = 1
    )
    INSERT INTO Trips (
      bus_id,
      schedule_id,
      trip_date,
      status,
      current_lat,
      current_lng,
      last_updated_at
    )
    VALUES (
      $2, -- bus_id
      $1, -- schedule_id
      $3, -- trip_date
      'in_progress',
      (SELECT lat FROM starting_stop),
      (SELECT lng FROM starting_stop),
      NOW()
    )
    RETURNING *;
  `;

  const result = await pool.query(query, [schedule_id, bus_id, today]);
  if (result.rows.length === 0) {
      throw new Error('Could not start trip. Ensure schedule ID is valid and has a starting stop (sequence=1).');
  }
  return result.rows[0];
};

const getActiveTrips = async () => {
  const query = `
    SELECT
      t.trip_id,
      t.bus_id,
      s.route_no,
      s.direction
    FROM Trips t
    JOIN Schedules s ON t.schedule_id = s.schedule_id
    WHERE t.status = 'in_progress' AND t.trip_date = CURRENT_DATE;
  `;
  const result = await pool.query(query);
  return result.rows;
};

module.exports = { 
  startTrip,
  getActiveTrips
};