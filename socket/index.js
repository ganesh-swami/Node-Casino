const User = require('../models/User');
const CurrentTable = require('../models/CurrentTable');
const jwt = require('jsonwebtoken');
const Table = require('../pokergame/Table');
const Player = require('../pokergame/Player');
const {
  FETCH_LOBBY_INFO,
  RECEIVE_LOBBY_INFO,
  PLAYERS_UPDATED,
  JOIN_TABLE,
  TABLE_JOINED,
  TABLES_UPDATED,
  LEAVE_TABLE,
  TABLE_LEFT,
  FOLD,
  CHECK,
  CALL,
  RAISE,
  TABLE_MESSAGE,
  SIT_DOWN,
  REBUY,
  STAND_UP,
  SITTING_OUT,
  SITTING_IN,
  DISCONNECT,
  TABLE_UPDATED,
  WINNER,
  TABLE_CREATED,
  CREATE_TABLE,
} = require('../pokergame/actions');
const config = require('../config');
const { getRandomHexString } = require('../utils');
const DBTable = require('../models/Table');
const DBPlayer = require('../models/Player');
const DBLog = require('../models/Log');

const tables = {
};
const players = {};

function getCurrentPlayers() {
  return Object.values(players).map((player) => ({
    socketId: player.socketId,
    id: player.id,
    name: player.name,
  }));
}

function getCurrentTables() {
  return Object.values(tables).map((table) => ({
    id: table.id,
    name: table.name,
    limit: table.limit,
    maxPlayers: table.maxPlayers,
    currentNumberPlayers: table.players.length,
    smallBlind: table.minBet,
    bigBlind: table.minBet * 2,
    currentPlayers: table.activePlayers().length,
  }));
}

const init = (socket, io) => {
  socket.on(FETCH_LOBBY_INFO, async (token) => {
    try {
      let user;

      jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
        if (err) console.log(err);
        else {
          user = decoded.user;
        }
      });

      if (user) {
        const found = Object.values(players).find((player) => {
          return player.id == user.id;
        });

        if (found) {
          delete players[found.socketId];
          const res = await DBPlayer.updateMany({socketId: found.socketId}, {active:false});
          console.log(res, '---------del all players')
          Object.values(tables).map(async(table) => {
            await removePlayerFromTable(table, found.socketId)
            broadcastToTable(table);
          });
        }

        user = await User.findById(user.id).select('-password');

        players[socket.id] = JSON.parse(JSON.stringify(new Player(
          socket.id,
          user._id,
          user.name,
          user.chipsAmount,
        )));
          
        var dbPlayer = new DBPlayer({
          socketId: socket.id,
          id: user._id,
          name: user.name,
          bankroll: user.chipsAmount,
        })
        await dbPlayer.save();

        socket.emit(RECEIVE_LOBBY_INFO, {
          tables: getCurrentTables(),
          players: getCurrentPlayers(),
          socketId: socket.id,
        });
        socket.broadcast.emit(PLAYERS_UPDATED, getCurrentPlayers());

        var dbLog = new DBLog({
          tableId:"",
          playerId:socket.id,
          action:"LOGINED",
          actionData:"",
          message:`${user.name} logined.`,
          tableData:"",
        })
        await dbLog.save();
      }
    } catch (error) {
      console.log(error, `---------${FETCH_LOBBY_INFO}`);
    }
  });

  socket.on(CREATE_TABLE, async (limit, seat) => {
    try {

      if (limit >= 1000 && seat >=2 && seat <= 5) {
        const tableId = getRandomHexString(10)
        // Create new room with the room ID as the name
        const table = new Table(tableId, `Table ${tableId}`, limit, seat)
        const player = players[socket.id];
        table.addPlayer(player);
        tables[tableId] = table;

        console.log(tables, tableId, '--------tableId, data:JSON.stringify(table)');
        var newTb = new DBTable({ tableId,
          tableName:`Table ${tableId}`,
          limit,
          seat,
          data:JSON.stringify(table) });
        await newTb.save();
        
        // // Join the room
        // socket.join(tableId);
        
        socket.emit(TABLE_CREATED, { tables: getCurrentTables(), tableId });
        socket.broadcast.emit(TABLES_UPDATED, getCurrentTables());
    
        if (
          tables[tableId].players &&
          tables[tableId].players.length > 0 &&
          player
        ) {
          let message = `${player.name} created the table.`;
          broadcastToTable(table, message);
        }
        
        var dbLog = new DBLog({
          tableId:tableId,
          playerId:socket.id,
          action:"TABLE_CREATED",
          actionData:"",
          message:`${player.name} created the table.`,
          tableData:JSON.stringify(table),
        })
        await dbLog.save();
      }
    } catch (error) {
      console.log(error, `---------${CREATE_TABLE}`);
    }
  });

  socket.on(JOIN_TABLE, async (tableId) => {
    try {
      
      const table = tables[tableId];
      const player = players[socket.id];

      table.addPlayer(player);

      socket.emit(TABLE_JOINED, { tables: getCurrentTables(), tableId });
      socket.broadcast.emit(TABLES_UPDATED, getCurrentTables());

      if (
        tables[tableId].players &&
        tables[tableId].players.length > 0 &&
        player
      ) {
        let message = `${player.name} joined the table.`;
        broadcastToTable(table, message);
      }
      
      var dbLog = new DBLog({
        tableId:tableId,
        playerId:socket.id,
        action:"TABLE_JOINED",
        actionData:"",
        message:`${player.name} joined the table.`,
        tableData:JSON.stringify(table),
      })
      await dbLog.save();
    } catch (error) {
      console.log(error, `---------${JOIN_TABLE}`);
    }
  });

  socket.on(LEAVE_TABLE, async (tableId) => {
    try {

      const table = tables[tableId];
      const player = players[socket.id];
      const seat = Object.values(table.seats).find(
        (seat) => seat && seat.player.socketId === socket.id,
      );

      if (seat && player) {
        updatePlayerBankroll(player, seat.stack);
      }

      await removePlayerFromTable(table, socket.id)
      
      io.emit(TABLES_UPDATED, getCurrentTables());
      socket.emit(TABLE_LEFT, { tables: getCurrentTables(), tableId });
      
      if (
        tables[tableId].players &&
        tables[tableId].players.length > 0 &&
        player
      ) {
        let message = `${player.name} left the table.`;
        broadcastToTable(table, message);
      }

      if (table.activePlayers().length === 1) {
        clearForOnePlayer(table);
      }
      
      var dbLog = new DBLog({
        tableId:tableId,
        playerId:socket.id,
        action:"TABLE_LEFT",
        actionData:"",
        message:`${player.name} left the table.`,
        tableData:JSON.stringify(table),
      })
      await dbLog.save();
    } catch (error) {
      console.log(error, `---------${LEAVE_TABLE}`);
    }
  });

  socket.on(FOLD, async (tableId) => {
    try {
      let table = tables[tableId];
      let res = table.handleFold(socket.id);
      res && broadcastToTable(table, res.message);
      res && changeTurnAndBroadcast(table, res.seatId);
      
      var dbLog = new DBLog({
        tableId:tableId,
        playerId:socket.id,
        action:"FOLD",
        actionData:res.seatId,
        message:res.message,
        tableData:JSON.stringify(table),
      })
      await dbLog.save();
    } catch (error) {
      console.log(error, `---------${FOLD}`);
    }
  });

  socket.on(CHECK, async (tableId) => {
    try {
      let table = tables[tableId];
      let res = table.handleCheck(socket.id);
      res && broadcastToTable(table, res.message);
      res && changeTurnAndBroadcast(table, res.seatId);

      var dbLog = new DBLog({
        tableId:tableId,
        playerId:socket.id,
        action:"CHECK",
        actionData:res.seatId,
        message:res.message,
        tableData:JSON.stringify(table),
      })
      await dbLog.save();
    } catch (error) {
      console.log(error, `---------${CHECK}`);
    }
  });

  socket.on(CALL, async (tableId) => {
    try {
      let table = tables[tableId];
      let res = table.handleCall(socket.id);
      res && broadcastToTable(table, res.message);
      res && changeTurnAndBroadcast(table, res.seatId);

      var dbLog = new DBLog({
        tableId:tableId,
        playerId:socket.id,
        action:"CALL",
        actionData:res.seatId,
        message:res.message,
        tableData:JSON.stringify(table),
      })
      await dbLog.save();
    } catch (error) {
      console.log(error, `---------${CALL}`);
    }
  });

  socket.on(RAISE, async ({ tableId, amount }) => {
    try {
      let table = tables[tableId];
      let res = table.handleRaise(socket.id, amount);
      res && broadcastToTable(table, res.message);
      res && changeTurnAndBroadcast(table, res.seatId);

      var dbLog = new DBLog({
        tableId:tableId,
        playerId:socket.id,
        action:"RAISE",
        actionData:res.seatId+":"+amount,
        message:res.message,
        tableData:JSON.stringify(table),
      })
      await dbLog.save();
    } catch (error) {
      console.log(error, `---------${RAISE}`);
    }
  });

  socket.on(TABLE_MESSAGE, async ({ message, from, tableId }) => {
    try {
      let table = tables[tableId];
      broadcastToTable(table, message, from);

      var dbLog = new DBLog({
        tableId:tableId,
        playerId:socket.id,
        action:"TABLE_MESSAGE",
        actionData:"",
        message:message,
        tableData:JSON.stringify(table),
      })
      await dbLog.save();
    } catch (error) {
      console.log(error, `---------${TABLE_MESSAGE}`);
    }
  });

  socket.on(SIT_DOWN, async ({ tableId, seatId, amount }) => {
    try {
      const table = tables[tableId];
      const player = players[socket.id];

      if (player) {
        table.sitPlayer(player, seatId, amount);
        let message = `${player.name} sat down in Seat ${seatId}`;

        updatePlayerBankroll(player, -amount);

        broadcastToTable(table, message);
        if (table.activePlayers().length === 2) {
          initNewHand(table);
        }

        var dbLog = new DBLog({
          tableId:tableId,
          playerId:socket.id,
          action:"SIT_DOWN",
          actionData:"",
          message:message,
          tableData:JSON.stringify(table),
        })
        await dbLog.save();
      }
    } catch (error) {
      console.log(error, `---------${SIT_DOWN}`);
    }
  });

  socket.on(REBUY, async ({ tableId, seatId, amount }) => {
    try {
      const table = tables[tableId];
      const player = players[socket.id];

      table.rebuyPlayer(seatId, amount);
      updatePlayerBankroll(player, -amount);

      broadcastToTable(table);

      var dbLog = new DBLog({
        tableId:tableId,
        playerId:socket.id,
        action:"REBUY",
        actionData:"",
        message:`${player.name} rebought.`,
        tableData:JSON.stringify(table),
      })
      await dbLog.save();
    } catch (error) {
      console.log(error, `---------${REBUY}`);
    }
  });

  socket.on(STAND_UP, async (tableId) => {
    try {
      const table = tables[tableId];
      const player = players[socket.id];
      const seat = Object.values(table.seats).find(
        (seat) => seat && seat.player.socketId === socket.id,
      );

      let message = '';
      if (seat) {
        updatePlayerBankroll(player, seat.stack);
        message = `${player.name} stood up`;
      }

      table.standPlayer(socket.id);

      broadcastToTable(table, message);
      if (table.activePlayers().length === 1) {
        clearForOnePlayer(table);
      }

      var dbLog = new DBLog({
        tableId:tableId,
        playerId:socket.id,
        action:"STAND_UP",
        actionData:"",
        message:`${player.name} stood up.`,
        tableData:JSON.stringify(table),
      })
      await dbLog.save();
    } catch (error) {
      console.log(error, `---------${STAND_UP}`);
    }
  });

  socket.on(SITTING_OUT, async ({ tableId, seatId }) => {
    try {
      const table = tables[tableId];
      const seat = table.seats[seatId];
      seat.sittingOut = true;

      broadcastToTable(table);

      var dbLog = new DBLog({
        tableId:tableId,
        playerId:socket.id,
        action:"SITTING_OUT",
        actionData:"",
        message:`${seatId} sat out.`,
        tableData:JSON.stringify(table),
      })
      await dbLog.save();
    } catch (error) {
      console.log(error, `---------${SITTING_OUT}`);
    }
  });

  socket.on(SITTING_IN, async ({ tableId, seatId }) => {
    try {
      const table = tables[tableId];
      const seat = table.seats[seatId];
      seat.sittingOut = false;

      broadcastToTable(table);
      if (table.handOver && table.activePlayers().length === 2) {
        initNewHand(table);
      }
      
      var dbLog = new DBLog({
        tableId:tableId,
        playerId:socket.id,
        action:"SITTING_IN",
        actionData:"",
        message:`${seatId} sat in.`,
        tableData:JSON.stringify(table),
      })
      await dbLog.save();
    } catch (error) {
      console.log(error, `---------${SITTING_IN}`);
    }
  });

  socket.on(DISCONNECT, async () => {
    try {
      const seat = findSeatBySocketId(socket.id);
      if (seat) {
        updatePlayerBankroll(seat.player, seat.stack);
      }

      var dbLog = new DBLog({
        tableId:"",
        playerId:socket.id,
        action:"DISCONNECT",
        actionData:"",
        message:`${players[socket.id].name} disconnected.`,
        tableData:"",
      })
      await dbLog.save();

      delete players[socket.id];
      await removeFromTables(socket.id);
      const res = await DBPlayer.updateMany({socketId: socket.id}, {active:false});

      socket.broadcast.emit(TABLES_UPDATED, getCurrentTables());
      socket.broadcast.emit(PLAYERS_UPDATED, getCurrentPlayers());
      
    } catch (error) {
      console.log(error, `---------${DISCONNECT}`);
    }
  });

  async function updatePlayerBankroll(player, amount) {
    const user = await User.findById(player.id);
    user.chipsAmount += amount;
    await user.save();

    console.log( players[socket.id], '-----------players[socket.id]')
    players[socket.id].bankroll += amount;
    const res = await DBPlayer.updateMany({socketId: player.socketId, id: player.id, active:true}, {bankroll:players[socket.id].bankroll});

    io.to(socket.id).emit(PLAYERS_UPDATED, getCurrentPlayers());
  }

  function findSeatBySocketId(socketId) {
    let foundSeat = null;
    Object.values(tables).forEach((table) => {
      Object.values(table.seats).forEach((seat) => {
        if (seat && seat.player.socketId === socketId) {
          foundSeat = seat;
        }
      });
    });
    return foundSeat;
  }

  async function removeFromTables(socketId) {
    for (let i = 0; i < Object.keys(tables).length; i++) {
      let table = tables[Object.keys(tables)[i]];
      await removePlayerFromTable(table, socketId)
    }
  }

  function broadcastToTable(table, message = null, from = null) {
    for (let i = 0; i < table.players.length; i++) {
      let socketId = table.players[i].socketId;
      let tableCopy = hideOpponentCards(table, socketId);
      io.to(socketId).emit(TABLE_UPDATED, {
        table: tableCopy,
        message,
        from,
      });
    }
  }

  function changeTurnAndBroadcast(table, seatId) {
    setTimeout(() => {
      table.changeTurn(seatId);
      broadcastToTable(table);

      if (table.handOver) {
        initNewHand(table);
      }
    }, 1000);
  }

  function initNewHand(table) {
    if (table.activePlayers().length > 1) {
      broadcastToTable(table, '---New hand starting in 5 seconds---');
    }
    setTimeout(() => {
      table.clearWinMessages();
      table.startHand();
      broadcastToTable(table, '--- New hand started ---');
    }, 5000);
  }

  function clearForOnePlayer(table) {
    table.clearWinMessages();
    setTimeout(() => {
      table.clearSeatHands();
      table.resetBoardAndPot();
      broadcastToTable(table, 'Waiting for more players');
    }, 5000);
  }

  function hideOpponentCards(table, socketId) {
    let tableCopy = JSON.parse(JSON.stringify(table));
    let hiddenCard = { suit: 'hidden', rank: 'hidden' };
    let hiddenHand = [hiddenCard, hiddenCard];

    for (let i = 1; i <= tableCopy.maxPlayers; i++) {
      let seat = tableCopy.seats[i];
      if (
        seat &&
        seat.hand.length > 0 &&
        seat.player.socketId !== socketId &&
        !(seat.lastAction === WINNER && tableCopy.wentToShowdown)
      ) {
        seat.hand = hiddenHand;
      }
    }
    return tableCopy;
  }

  async function removePlayerFromTable(table, socketId) {
    table.removePlayer(socketId);
    if (table.satPlayers().length === 0) {
      delete tables[table.id];
      const res = await DBTable.updateMany({tableId:table.id}, {active:false});
    }
  }
};

module.exports = { init, tables };
