// session controller — delegates to sessionService (US-10)

const sessionService = require('../services/sessionService');

const startSession = async (req, res, next) => {
  try {
    const session = await sessionService.startSession(req.user.userId, req.body);
    res.status(201).json({ success: true, data: { session } });
  } catch (err) {
    next(err);
  }
};

const getActiveSession = async (req, res, next) => {
  try {
    const session = await sessionService.getActiveSession(req.user.userId);
    res.json({ success: true, data: { session } });
  } catch (err) {
    next(err);
  }
};

const pauseSession = async (req, res, next) => {
  try {
    const session = await sessionService.pauseSession(req.params.id, req.user.userId);
    res.json({ success: true, data: { session } });
  } catch (err) {
    next(err);
  }
};

const resumeSession = async (req, res, next) => {
  try {
    const session = await sessionService.resumeSession(req.params.id, req.user.userId);
    res.json({ success: true, data: { session } });
  } catch (err) {
    next(err);
  }
};

const endSession = async (req, res, next) => {
  try {
    const result = await sessionService.endSession(req.params.id, req.user.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getSessionHistory = async (req, res, next) => {
  try {
    const result = await sessionService.getSessionHistory(req.user.userId, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  startSession,
  getActiveSession,
  pauseSession,
  resumeSession,
  endSession,
  getSessionHistory,
};
