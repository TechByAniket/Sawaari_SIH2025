const tripService = require('../services/tripService');

const startTrip = async (req, res) => {
  // The admin will send the schedule and the bus to assign to it.
  const { schedule_id, bus_id } = req.body;

  if (!schedule_id || !bus_id) {
    return res.status(400).json({ error: 'schedule_id and bus_id are required.' });
  }

  try {
    const newTrip = await tripService.startTrip(schedule_id, bus_id);
    res.status(201).json({ message: 'Trip started successfully!', trip: newTrip });
  } catch (err) {
    // Handle specific errors, like a bus being double-booked
    if (err.code === '23505') { // Unique violation error code
      return res.status(409).json({ error: 'This bus is already assigned to an active trip.' });
    }
    res.status(500).json({ error: err.message });
  }
};

module.exports = { startTrip };