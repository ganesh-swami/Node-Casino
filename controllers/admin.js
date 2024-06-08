const { templates, templateList } = require('../mails/templateList');
const Log = require('../models/Log');
const Player = require('../models/Player');
const Table = require('../models/Table');
const User = require('../models/User');


// @route   GET api/mails
// @desc    Get a list of transactional templates
// @access  Public
exports.getDashboard = async (req, res) => {
  try {
    const tableCount = await Table.find().count();
    const activeTableCount = await Table.find({active:true}).count();
    const inactiveTableCount = tableCount - activeTableCount;

    const userCount = await User.find().count();

    const playerCount = await Player.find().count();
    const activePlayerCount = await Player.find({active:true}).count();
    const inactivePlayerCount = playerCount - activePlayerCount;

    const topUsers = await User.find().sort({chipAmount: -1}).limit(20);

    // console.log({
    //   tableCount,
    //   activeTableCount,
    //   inactiveTableCount,
    //   userCount,
    //   playerCount,
    //   activePlayerCount,
    //   inactivePlayerCount,
    //   topUsers,
    // })

    res.status(200).json({
      tableCount,
      activeTableCount,
      inactiveTableCount,
      userCount,
      playerCount,
      activePlayerCount,
      inactivePlayerCount,
      topUsers,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()

    console.log({
      users
    })

    res.status(200).json({
      users
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find()

    console.log({
      tables
    })

    res.status(200).json({
      tables
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getPlayers = async (req, res) => {
  try {
    const players = await Player.find()

    console.log({
      players
    })

    res.status(200).json({
      players
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const logs = await Log.find()

    console.log({
      logs
    })

    res.status(200).json({
      logs
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getOverview = (req, res) => {
  if (req.query.format === 'html') {
    res.send(templateList);
  } else {
    res.json(templates);
  }
};

exports.getRakefee = (req, res) => {
  if (req.query.format === 'html') {
    res.send(templateList);
  } else {
    res.json(templates);
  }
};

exports.getPerformance = (req, res) => {
  if (req.query.format === 'html') {
    res.send(templateList);
  } else {
    res.json(templates);
  }
};

