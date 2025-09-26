const pool = require('../config/db');

const startTrip = async (schedule_id, bus_id) => {
  const today = new Date().toISOString().split('T')[0];

  // 1) Load schedule to get route_no and direction
  const schedRes = await pool.query(
    `SELECT route_no, direction FROM Schedules WHERE schedule_id = $1`,
    [schedule_id]
  );
  if (schedRes.rows.length === 0) {
    throw new Error('Schedule not found.');
  }
  const { route_no, direction } = schedRes.rows[0];

  // 2) Resolve first stop for that route/direction (robust matching)
  const stopRes = await pool.query(
    `SELECT stop_id, lat, lng
     FROM Stops
     WHERE LOWER(TRIM(route_no)) = LOWER(TRIM($1))
       AND LOWER(TRIM(direction)) = LOWER(TRIM($2))
     ORDER BY sequence ASC
     LIMIT 1`,
    [route_no, direction]
  );
  if (stopRes.rows.length === 0) {
    throw new Error(`No stops found for route '${route_no}' and direction '${direction}'.`);
  }
  const { stop_id, lat, lng } = stopRes.rows[0];

  // 3) Insert trip with resolved next_stop and coordinates
  const insertQuery = `
    INSERT INTO Trips (
      bus_id,
      schedule_id,
      trip_date,
      status,
      next_stop_id,
      current_lat,
      current_lng,
      last_updated_at
    ) VALUES (
      $1, $2, $3, 'in_progress', $4, $5, $6, NOW()
    )
    RETURNING *;
  `;

  const result = await pool.query(insertQuery, [
    bus_id,
    schedule_id,
    today,
    stop_id,
    lat,
    lng,
  ]);

  return result.rows[0];
};

module.exports = { startTrip };