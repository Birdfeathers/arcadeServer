require('dotenv').config();
const {
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
          noOverline INTEGER DEFAULT 0,
          noThreeThree INTEGER DEFAULT 0,
          noFourFour INTEGER DEFAULT 0,
          giveWarning INTEGER DEFAULT 0,
          timeCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          lastUpdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "playerOne" INTEGER REFERENCES users(id),
          "playerTwo" INTEGER REFERENCES users(id),
          "owner" INTEGER REFERENCES users(id),
          moveHistory VARCHAR,
          winner VARCHAR
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
    // I want to know the order, so I'll do it one at a time
    const user1 = await createUser(usersToCreate[0]);
    const user2 = await createUser(usersToCreate[1]);
    const user3 = await createUser(usersToCreate[2]);
    const users = [user1, user2, user3];
    // const users = await Promise.all(usersToCreate.map(createUser));
    console.log('Users created:');
    console.log(users);
    console.log('Finished creating users!');


  } catch(error){
    console.log('Error creating users!');
    throw error;
  }
}

async function testUserFunctions()
{
  console.log('Starting to test user functions...')
  try{
    const username = "Rebecca";
    console.log(`Getting user by username ${username}...`);
    const userByUsername = await getUserByUsername(username);
    console.log(userByUsername);
    const id = 3;
    console.log(`Getting user by id ${id}...`);
    const userById = await getUserById(id);
    console.log(userById);
    console.log('Testing correct password...')
    const userAttempt1 = await checkLogin({username: 'Rebecca', password: 'RebeccaPassword'});
    console.log(userAttempt1);
    // console.log('Testing with incorrect password...');
    // const userAttempt2 = await checkLogin({username:'Ian',password: 'Bedian'});
    // console.log(userAttempt2);
    // console.log('Testing with nonexistant user...');
    // const userAttempt3 = await checkLogin({username: 'Daniel', password: 'Moon'});
    // console.log(userAttempt3);
    console.log('Testing get all users ...');
    const users = await getAllUsers();
    console.log(users);
    console.log('Testing changing user password...')
    const newUser = await changeUserPassword({id: 1, password: 'trinary'});
    console.log(newUser);
    console.log('Finished user tests.');
  }catch(error){
    console.log('Error with user functions');
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
      {row: 2, col: 2},
      //{row: 2, col: 0},
    ]

    const gamesToCreate = [
      {rows: 3, cols: 3, toWin: 3, playerOne: 1, playerTwo: 1, moveHistory: JSON.stringify(game1Moves), owner: 3},
      {rows: 3, cols: 3, toWin: 3, playerOne: 2, playerTwo: 3, moveHistory: JSON.stringify(game2Moves), owner: 2}
    ]
    let games = [];
    games[0] = await createGame(gamesToCreate[0]);
    games[1] = await createGame(gamesToCreate[1]);
    // const games = await Promise.all(gamesToCreate.map(createGame));
    console.log('Games created:');
    console.log(games);
    console.log('Finished creating games!');


  } catch(error){
    console.log('Error creating games!');
    throw error;
  }
}

async function testGameFunctions()
{
  const longerMoves = [
    {row: 1, col:1},
    {row: 0, col: 1},
    {row: 0, col: 2},
    {row: 2, col: 0},
    {row: 2, col: 2},
    {row: 0, col: 0},
    {row: 1, col: 2}
  ]

  const shorterMoves = [
    {row: 1, col:1},
    {row: 0, col: 1},
    {row: 0, col: 2},
    {row: 2, col: 0},
    {row: 2, col: 2},
  ]

  const moves2 = [
    {row: 0, col: 0},
    {row: 1, col: 1},
    {row: 0, col: 2},
    {row: 0, col: 1},
    {row: 2, col: 1},
    {row: 1, col: 0},
    {row: 1, col: 2},
    {row: 2, col: 2},
    {row: 2, col: 0},
  ]
  try{
      console.log('Testing Game functions ...');
      const id = 1;
      console.log(`Getting game with id ${id}...`);
      const game = await getGame(id);
      const game2 = await getGame(2);
      console.log(game);
      const userId = 3;
      console.log(`Getting all games belonging to user ${userId}...`);
      const games = await getGamesByUser(userId);
      console.log(games);
      console.log('Testing update move history with shorter moves ...');
      const moveHistory1 = await updateMoveHistory({id: 1, moveHistory: shorterMoves, game});
      console.log(moveHistory1);
      console.log('Testing update move history with longer moves...');
      const moveHistory2 = await updateMoveHistory({id:1, moveHistory: longerMoves, game});
      console.log(moveHistory2);
      // console.log('Testing update to tie ...')
      // const moveHistory3 = await updateMoveHistory({id:2, moveHistory: moves2, game: game2});
      // console.log(moveHistory3);
      console.log('Finished testing game functions.')
  } catch(error){
      console.log('Error with game functions.')
      throw error;
  }


}

async function buildDB() {
  try {
    await createInitialUsers();
    await createInitialGames();
    await testUserFunctions();
    await testGameFunctions();
  } catch (error) {
    console.log('Error during rebuildDB')
    throw error;
  }
}

buildTables()
  .then(buildDB)
  .catch(console.error)
  .finally(() => client.end());