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

module.exports = {client, createUser, createGame};