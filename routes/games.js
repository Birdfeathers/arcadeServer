const express= require('express');
const gamesRouter = express.Router();
const {
    createGame,
    getGame,
    getGamesByUser,
    updateMoveHistory}
= require('../db/index');
const {requireUser} = require('./utils');

// registration/ create new user
gamesRouter.post('/newgame', requireUser, async(req, res, next) => {
    const owner = req.user.id;
    const {rows, cols, toWin, against, goesFirst} = req.body;
    const playerOne = goesFirst ? {owner}:{against};
    const playerTwo = goesFirst ? {against} : {owner};
    
    try{
        const game = await createGame({rows, cols, toWin, playerOne, playerTwo, owner, moveHistory:""});
        res.send(game); 
    } catch(error){
        next(error);
    }
})

gamesRouter.get('/game/:gameId', async (req, res, next) => {
    const {gameId} = req.params;
    try{
        const game = await getGame(gameId);
        res.send(game);
    } catch(error) {
        next(error);
    }
})

gamesRouter.get('/usergames', requireUser, async (req, res, next) => {
    const id = req.user.id;
    try{
        const games = await getGamesByUser(id);
        res.send(games);
    } catch(error) {
        next(error);
    }
})

gamesRouter.patch('/move', requireUser, async (req, res, next) => {
    try{
        const moves = await updateMoveHistory(req.body);
        res.send(moves);
    } catch(error){
        next(error);
    }
})

module.exports = gamesRouter;