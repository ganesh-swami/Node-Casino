const config = require("../config");

const CurrentTable = require("../models/CurrentTable");
const gameSocket = require("../socket/index");

// import {tables} from '../socket/index'
// @route   POST api/users
// @desc    Register User
// @access  Public

function checkCurrentTables() {
  // console.log("-----------------checkCurrentTables------------------")
  let flag = 0;
  const currentTables = CurrentTable.find({});
  // console.log("currentTables--------------", currentTables.length )

  currentTables.map((currentTable) => {
    console.log("tableNumber", currentTable.tableNumber);
    if (
      tables[currentTable.tableNumber].seats[1] == null &&
      tables[currentTable.tableNumber].seats[1] == null &&
      tables[currentTable.tableNumber].seats[1] == null &&
      tables[currentTable.tableNumber].seats[1] == null &&
      tables[currentTable.tableNumber].seats[1] == null
    ) {
      //CurrentTable.deleteOne({ _id: currentTable._id  });
    }
  });
}

exports.create = async (req, res) => {
  try {
    let name = "1";
    let currentTable = await User.findOne({ name });

    console.log("seatNumber", req.body);

    if (currentTable) {
      res.status(400).json({
        errors: [
          {
            msg: "Error",
          },
        ],
      });
    }
    let x = Math.floor(Math.random() * 10) + 1;

    const tables = await CurrentTable.find({});
    tables.map((table) => {
      if (table.tableNumber == x) {
        x = Math.floor(Math.random() * 10) + 1;
      }
    });
    currentTable = new CurrentTable({
      name: x,
      tableNumber: x,
      seatNumber: req.body.seatNumber,
    });

    console.log(currentTable);

    await currentTable.save();
    res.json({ currentTable });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

exports.getAllCurrentTable = async (req, res) => {
  try {
    const currentTable = await CurrentTable.find({});
    for (let i = 0; i < currentTable.length; i++) {
      // console.log("currentTable", currentTable[i].)
      //   console.log("tableNumber", currentTable[i].tableNumber)
      //  console.log("table", gameSocket.tables[1])

      if (
        gameSocket.tables[currentTable[i].tableNumber].seats["1"] == null &&
        gameSocket.tables[currentTable[i].tableNumber].seats["2"] == null &&
        gameSocket.tables[currentTable[i].tableNumber].seats["3"] == null &&
        gameSocket.tables[currentTable[i].tableNumber].seats["4"] == null &&
        gameSocket.tables[currentTable[i].tableNumber].seats["5"] == null
      ) {
        await CurrentTable.deleteOne({ _id: currentTable[i]._id });
        //console.log("table", gameSocket.tables[currentTable[i].tableNumber])
      }
    }

    console.log(currentTable);

    return res.json({ currentTable });
  } catch (error) {
    console.error(err.message);
    return res.status(500).json({ msg: "Internal server error" });
  }
};
