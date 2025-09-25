const pool = require("../config/db");

// GET /buses/search?query=andh
async function searchBusRoutes(query) {
  const sql = `
    SELECT route_no, source, destination
    FROM routes
    WHERE source ILIKE $1 OR destination ILIKE $1 OR route_no::TEXT ILIKE $1;
  `;
  const searchTerm = `%${query}%`;
  
  try {
    const result = await pool.query(sql, [searchTerm]);
    return result.rows;
  } catch (error) {
    console.error('Error executing searchBusRoutes query:', error);
    throw error;
  }
}

// GET /routes/:route_no/active-buses ----- example --> /routes/502/active-buses?direction=UP
const getActiveBusesByRoute = async (route_no, direction) => {
  let query = `
    SELECT bus_id, route_no, direction, lat, lng, next_stop_id, status
    FROM activeRoutes
    WHERE route_no = $1
  `;
  const params = [route_no];

  if (direction) {
    query += " AND direction = $2";
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

async function getAllBusRoutes() {
  const sql = `SELECT * FROM activeroutes`;
  try {
    const result = await pool.query(sql);
    return result.rows; // Returns an array of all rows from the table
  } catch (error) {
    console.error('Error executing getAllBusRoutes query:', error);
    throw error;
  }
}

module.exports = { getActiveBusesByRoute, searchBusRoutes, getAllBusRoutes };