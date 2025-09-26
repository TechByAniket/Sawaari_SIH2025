const scheduleService = require('../services/scheduleService');

const getTodaySchedules = async (req, res) => {
  try {
    const schedules = await scheduleService.getTodaySchedules();
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getTodaySchedules };