const User = require("../models/User");

// @route   GET api/chips/slotchips
// @desc    Get slotchips if user has zero chips left
// @access  Private
exports.handleSlotChipsRequest = async (req, res) => {
  try {
    const { slotchips } = req.body;
    console.log(slotchips, "----slotchips");
    const user = await User.findById(req.user.id).select("-password");
    console.log(user, "----user");
    user.chipsAmount = slotchips;
    await user.save();
    return res.status(200).json(user);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Internal server error");
  }
};
