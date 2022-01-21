const {client,
createUser,
createGame
} = require('./index');

async function buildTables() {
    try {
      client.connect();

      console.log("dropping tables ...")
      await client.query(`
        DROP TABLE IF EXISTS games;
        DROP TABLE IF EXISTS users;
      `)

      console.log("building tables ...")
      await client.query(`
      CREATE TABLE users(
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );

      CREATE TABLE games(
          id SERIAL PRIMARY KEY,
          rows INTEGER NOT NULL,
          cols INTEGER NOT NULL,
          toWin INTEGER NOT NULL,
          "playerOne" INTEGER REFERENCES users(id),
          "playerTwo" INTEGER REFERENCES users(id),
          "owner" INTEGER REFERENCES users(id),
          moveHistory VARCHAR
        );
      `)
    } catch(error){
        throw error;
    }
}

async function createInitialUsers()
{
  console.log('Starting to create users...')
  try{
    const usersToCreate = [
      {username: 'computer', password: 'binary'},
      {username: 'Rebecca', password: 'RebeccaPassword'},
      {username: 'Ian', password: 'IanPassword'}
    ]
    const users = await Promise.all(usersToCreate.map(createUser));
    console.log('Users created:');
    console.log(users);
    console.log('Finished creating users!');


  } catch(error){
    console.log('Error creating users!');
    throw error;
  }
}

async function createInitialGames()
{
  console.log('Starting to create games...')
  try{
    const game1Moves = [
      {row: 1, col:1},
      {row: 0, col: 1},
      {row: 0, col: 2},
      {row: 2, col: 0},
      {row: 2, col: 2},
      {row: 0, col: 0},
      // {row: 1, col: 2}
    ]

    const game2Moves = [
      {row: 0, col: 0},
      {row: 1, col: 1},
      {row: 0, col: 2},
      {row: 0, col: 1},
      {row: 2, col: 1},
      {row: 1, col: 0},
      {row: 1, col: 2},
      {row: 2, col: 0},
      {row: 2, col: 2}
    ]

    const gamesToCreate = [
      {rows: 3, cols: 3, toWin: 3, playerOne: 1, playerTwo: 1, moveHistory: JSON.stringify(game1Moves), owner: 3},
      {rows: 3, cols: 3, toWin: 3, playerOne: 2, playerTwo: 3, moveHistory: JSON.stringify(game2Moves), owner: 2}
    ]
    const games = await Promise.all(gamesToCreate.map(createGame));
    console.log('Games created:');
    console.log(games);
    console.log('Finished creating games!');


  } catch(error){
    console.log('Error creating games!');
    throw error;
  }
}

async function buildDB() {
  try {
    await createInitialUsers();
    await createInitialGames();
  } catch (error) {
    console.log('Error during rebuildDB')
    throw error;
  }
}

buildTables()
  .then(buildDB)
  .catch(console.error)
  .finally(() => client.end());