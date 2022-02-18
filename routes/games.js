const express= require('express');
const gamesRouter = express.Router();
const {
    createGame,
    getGame,
    getGamesByUser,
    updateMoveHistory,
    updateStatus,
    deleteGame
}
= require('../db/index');
const {findAllLines, checkViolations, findWinningLines}  = require('../db/findLines');
const {requireUser} = require('./utils');

// registration/ create new user
gamesRouter.post('/newgame', requireUser, async(req, res, next) => {
    const variables = req.body
    variables.owner = req.user.id;
    variables.moveHistory = "";
    const {against, goesFirst} = req.body;
    if(goesFirst){
        variables.playerOne = variables.owner;
        variables.playerTwo = against;
    } else{
        variables.playerOne = against;
        variables.playerTwo = variables.owner
    }
    
    try{
        const game = await createGame(variables);
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
        console.log("moveHistory", moveHistory);
        const result = findWinningLines({history: moveHistory, rows: rows, cols: cols}, towin);
        res.send(result);
    } catch(error){
        next(error);
    }
})

gamesRouter.post('/violations', async (req, res, next) => {
    try{
        const {moveHistory, rows, cols, overline, threeThree, fourFour} = req.body;
        const result = checkViolations(moveHistory, rows, cols, {overline, threeThree, fourFour});
        res.send(result);

    } catch(error){
        next(error);
    }
})

gamesRouter.patch('/status/:gameId', requireUser, async (req, res, next) => {
    try{
        const {gameId} = req.params;
        const {status} = req.body;
        await updateStatus(gameId, status);
    } catch(error){
        next(error);
    }
})

gamesRouter.delete('/:gameId', requireUser, async (req, res, next) => {
    const {gameId} = req.params;
    try {
       await deleteGame(gameId);
    } catch (error) {
        next(error)
    }
})

module.exports = gamesRouter;