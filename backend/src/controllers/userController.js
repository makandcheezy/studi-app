const userService = require('../services/userService');

const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await userService.getDashboard(req.user.id);
    res.json({ success: true, data: dashboard });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
