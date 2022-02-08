const express= require('express');
const gamesRouter = express.Router();
const {
    createGame,
    getGame,
    getGamesByUser,
    updateMoveHistory}
= require('../db/index');
const {findAllLines, checkViolations}  = require('../db/findLines');
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
        let winLines = [];
        console.log("in")
        const result = findAllLines({history: moveHistory, rows: rows, cols: cols});
        winLines = result.lines.filter(line => line.length >= towin);
        const last  = moveHistory.pop();
        console.log("last", last)
        if(last){
         if(last.illegal)winLines = [{color: "white", lineNum: -1}];
        }
        res.send({winLines, board: result.board});
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

module.exports = gamesRouter;