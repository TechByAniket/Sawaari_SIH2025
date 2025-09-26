const pool = require('../config/db');

const getTodaySchedules = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  const query = `
    SELECT
      s.schedule_id,
      s.departure_time,
      s.route_no,
      s.direction,
      r.source,
      r.destination
    FROM Schedules s
    JOIN Routes r ON s.route_no = r.route_no
    -- Use a LEFT JOIN to find schedules that DON'T have a matching trip today
    LEFT JOIN Trips t ON s.schedule_id = t.schedule_id AND t.trip_date = $1
    WHERE t.trip_id IS NULL -- This is the key: only return schedules with no trip yet
    ORDER BY s.departure_time;
  `;

  const result = await pool.query(query, [today]);
  return result.rows;
};

module.exports = { getTodaySchedules };