const busService = require("../services/busService");

// GET /buses/search?query=andh
const searchBusRoutes = async (req, res) => {
  const query = req.query.query;
  try {
    const results = await busService.searchBusRoutes(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /routes/:route_no/active-buses ----- example --> /routes/502/active-buses?direction=UP
const getActiveBusesByRoute = async (req, res) => {
  const { route_no } = req.params;
  const { direction } = req.query; // optional filter
  try {
    const buses = await busService.getActiveBusesByRoute(route_no, direction);
    res.json(buses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllBusRoutes = async (req, res) => {
  try {
    const routes = await busService.getAllBusRoutes();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getActiveBusesByRoute, searchBusRoutes, getAllBusRoutes };