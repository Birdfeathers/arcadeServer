const { Client } = require('pg');
const DB_NAME = 'arcade_db'
const DB_URL = process.env.DATABASE_URL || `postgres://localhost:5432/${ DB_NAME }`;
const client = new Client(DB_URL);

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
        SELECT *
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

async function createGame({rows, cols, toWin, playerOne, playerTwo, moveHistory, owner}) {

    try {
        const {rows: [game]} = await client.query(`
            INSERT INTO games (rows, cols, toWin, "playerOne", "playerTwo", moveHistory, "owner")
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `, [rows, cols, toWin, playerOne, playerTwo, moveHistory, owner]);  // create user in db
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
  async function updateMoveHistory({id, moveHistory})
  {
      
      try{
          const {rows: [moves]} = await client.query(`
            UPDATE games
            SET moveHistory =
            CASE
             WHEN length(moveHistory) < length($1) THEN $1
             ElSE moveHistory
            END
            WHERE id = $2
            RETURNING moveHistory;
          `, [moveHistory, id])
          return moves;

      } catch(error) {
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
    updateMoveHistory
};