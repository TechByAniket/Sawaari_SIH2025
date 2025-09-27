const tripService = require('../services/tripService');

const startTrip = async (req, res) => {
    const { schedule_id, bus_id } = req.body;
  
    if (!schedule_id || !bus_id) {
      return res.status(400).json({ error: 'schedule_id and bus_id are required.' });
    }
  try {
    const newTrip = await tripService.startTrip(schedule_id, bus_id);
    res.status(201).json({ message: 'Trip started successfully!', trip: newTrip });
  } catch (err) {
    if (err.code === '23505') { // Unique violation error
      return res.status(409).json({ error: 'This bus is already assigned to an active trip.' });
    }
    res.status(500).json({ error: err.message });
  }
};
  
  const getActiveTrips = async (req, res) => {
    try {
      const activeTrips = await tripService.getActiveTrips();
      res.json(activeTrips);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  const completeTrip = async (req, res) => {
    const { tripId } = req.params;
    if (!tripId) {
      return res.status(400).json({ error: 'tripId parameter is required.' });
    }
    try {
      const updated = await tripService.completeTrip(parseInt(tripId, 10));
      res.json({ message: 'Trip marked as completed.', trip: updated });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  
  module.exports = { startTrip, getActiveTrips, completeTrip };