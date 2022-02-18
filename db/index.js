const { Client } = require('pg');
const DB_NAME = 'arcade_db'
const DB_URL = process.env.DATABASE_URL || `postgres://localhost:5432/${ DB_NAME }`;
const client = new Client(DB_URL);
const {findAllLines, checkViolations, findWinningLines } = require('./findLines');

const bcrypt = require('bcrypt'); // import bcrypt

//============== USERS ==============================
async function createUser({username, password}) {
    const SALT_COUNT = 10;   // salt makes encryption more complex
    const hashedPassword = await bcrypt.hash(password, SALT_COUNT);

    try {
        const {rows: [user]} = await client.query(`
            INSERT INTO users (username, password)
            VALUES ($1, $2)
            ON CONFLICT (username) DO NOTHING
            RETURNING *;
        `, [username, hashedPassword]);  // create user in db
        delete user.password;
        return user;     // populate user info
    }
    catch (error) {
        throw error;
    }
  }

  // ------------------- get user (with username) -------------

async function getUserByUsername(username) {
    try {
      const {rows: [user] } = await client.query(`
      SELECT *
      FROM users
      WHERE username=$1`, [username]);
  
      return user;
    } catch (error) {
      throw error;
    }
  }

   // -------------------get user (with user id)---------------

   async function getUserById(id){
    try{
        const {rows: [user]} = await client.query(`
        SELECT * FROM users
        WHERE id= $1;
        `, [id]);

        delete user.password;

        return user;
    }
    catch(error){
        throw error;
    }
}

// ------------------check login--------------------------

async function checkLogin({username, password}) { 
    try {
      const user = await getUserByUsername(username);

      if (!user) throw Error('Your username or password is incorrect!'); // verify that the username exists

      // comparing the password sent in to the password of that username
      // we need bcrypt because the password is encrypted
      const passwordIsMatch = await bcrypt.compare(password, user.password); // verify passwords match

      if (passwordIsMatch) {   // if passwords match delete password and continue
        delete user.password;
        return user;  // populate user info which can be accessed by backend api
      } else {
        throw Error('Your username or password is incorrect!');
      }
    } catch (error) {
      throw error;
    }
  }

  // ---------- get all users -----------------------------------

  async function getAllUsers(){ // select all the users
    try {
      const {rows: users} = await client.query(`
        SELECT id, username
        FROM users;
      `);
      return users;   // return all the users
    } catch (error) {
      throw error;
    }
  }

  // ---------- change user password -----------------------------------
async function changeUserPassword({id, password})
{
    const SALT_COUNT = 10;   // salt makes encryption more complex
    const hashedPassword = await bcrypt.hash(password, SALT_COUNT);

    try{
        const {rows: [user]} = await client.query(`
        UPDATE users
        SET password = $1
        WHERE id = $2
        RETURNING *;
        `, [hashedPassword, id])
        return user;

    } catch(error) {
        throw error;
    }
}

//============== Games ==============================

async function createGame({rows, cols, toWin, playerOne, playerTwo, moveHistory, owner, overline = 0, threeThree = 0, fourFour = 0, giveWarning = 0}) {

    try {
        const {rows: [game]} = await client.query(`
            INSERT INTO games (rows, cols, toWin, "playerOne", "playerTwo", moveHistory, "owner", noOverline, noThreeThree, noFourFour, giveWarning)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *;
        `, [rows, cols, toWin, playerOne, playerTwo, moveHistory, owner, overline, threeThree, fourFour, giveWarning]);  // create user in db
        return game;
    }
    catch (error) {
        throw error;
    }
  }
// ---------- get game by id -----------------------------------
  async function getGame(id)
  {
      try{
          const {rows: [game]} = await client.query(`
          SELECT games.*, 
            owner.username AS ownerusername, 
            playerOne.username AS playerOneUsername,
            playerTwo.username AS playerTwoUsername
          FROM games
          JOIN users owner ON games."owner" = owner.id
          JOIN users playerOne ON games."playerOne" = playerOne.id
          JOIN users playerTwo ON games."playerTwo" = playerTwo.id
          WHERE games.id = $1;
          `, [id])
          return game;

      } catch (error) {

      }
  }

  // ---------- get games by user -----------------------------------

  async function getGamesByUser(userId)
  {
      try{

          const {rows: games} = await client.query(`
          SELECT games.*, 
            owner.username AS ownerusername, 
            playerOne.username AS playerOneUsername,
            playerTwo.username AS playerTwoUsername
          FROM games
          JOIN users owner ON games."owner" = owner.id
          JOIN users playerOne ON games."playerOne" = playerOne.id
          JOIN users playerTwo ON games."playerTwo" = playerTwo.id
          WHERE games."owner" = $1 
          OR games."playerOne" = $1
          OR games."playerTwo" = $1;
          `, [userId])
          return games;

      } catch (error) {
        throw error;
      }
  }

// ---------- update moves after each move -----------------------------------

  async function updateMoves(id, moveHistory)
  {
      moveHistory = JSON.stringify(moveHistory);
      try{
          const {rows: [moves]} = await client.query(`
            UPDATE games
            SET moveHistory =
            CASE
             WHEN length(moveHistory) < length($1) THEN $1
             ElSE moveHistory
            END,
            lastUpdate = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING moveHistory;
          `, [moveHistory, id])
          return moves;

      } catch(error) {
          throw error;
      }
  }

  async function updateWinner(id, winner)
  {
    try{
      await updateStatus(id, 'complete');
      const {rows: [game]} = await client.query(`
        UPDATE games
        SET winner = $1
        WHERE id = $2
        RETURNING *;
      `, [winner, id]);

    } catch(error) {
      throw error;
    }
  }

  async function updateStatus(id, status)
  {
    try{
      const {rows: [game]} = await client.query(`
        UPDATE games
        SET status = $1
        WHERE id = $2
        RETURNING *;
      `, [status, id])

    } catch(error) {
      throw error;
    }
  }

  async function updateMoveHistory({id, moveHistory})
  {
    try{
      let game = await getGame(id);
      let win = game.winner;
      let violated = false;
      if(game.status == "complete") throw Error("Game Already over");
      if(game.status == "pending") throw Error("You can't play while the game is pending.")
      const violations = checkViolations(moveHistory, game.rows, game.cols, {overline: game.nooverline, threeThree: game.nothreethree, fourFour: game.nofourfour});
      if((violations.overline && game.nooverline)|| (violations.threeThree && game.nothreethree)|| (violations.fourFour && game.nofourfour))
      {
        moveHistory[moveHistory.length - 1].illegal = true;
        updateWinner(id,"white");
        violated = true;
      } 
      const result = findWinningLines({history: moveHistory, rows: game.rows, cols: game.cols}, game.towin);
      let winLines = result.winLines;
      console.log("winLines", winLines)
      if(!win && winLines.length > 0 && !violated){ 
        updateWinner(id, winLines[0].color);
        win = true;
      }
      const moves = await updateMoves(id, moveHistory);
      if(!win && JSON.parse(moves.movehistory).length === game.rows * game.cols) updateWinner(id, "tie");
      return {moves, winLines, board: result.board, violations};
    } catch(error)
    {
      throw error;
    }
      
  }

  async function deleteGame(id)
  {
    try{
      await client.query(`
      DELETE FROM games
      WHERE id=$1;`,[id]);

    } catch(error)
    {
      throw error;
    }
  }

module.exports = {
    client, 
    createUser,
    getUserByUsername,
    getUserById,
    checkLogin,
    getAllUsers,
    changeUserPassword, 
    createGame,
    getGame,
    getGamesByUser,
    updateMoveHistory,
    updateStatus,
    deleteGame
};