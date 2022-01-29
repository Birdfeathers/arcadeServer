const express= require('express');
const gamesRouter = express.Router();
const {
    createGame,
    getGame,
    getGamesByUser,
    updateMoveHistory}
= require('../db/index');
const findAllLines  = require('../db/findLines');
const {requireUser} = require('./utils');

// registration/ create new user
gamesRouter.post('/newgame', requireUser, async(req, res, next) => {
    const owner = req.user.id;
    const {rows, cols, toWin, against, goesFirst} = req.body;
    let playerOne, playerTwo;
    if(goesFirst){
        playerOne = owner;
        playerTwo = against;
    } else{
        playerOne = against;
        playerTwo = owner
    }
    
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

gamesRouter.post('/winLines', async (req, res, next) => {
    try{
        const {moveHistory, rows, cols, towin} = req.body;
        const result = findAllLines(moveHistory, rows, cols);
        const winLines = result.lines.filter(line => line.length >= towin);
        res.send({winLines, board: result.board});
    } catch(error){
        next(error);
    }
})
module.exports = gamesRouter;