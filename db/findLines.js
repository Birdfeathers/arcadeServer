'use strict';
/* below are some enum-like constants - I changed references to the constants
** into references to these vars to avoid magic numbers. */
// constants representing stone colors
const White = "white"
const Black = "black"
const None = "none"
// constants for representing line directions
const Horizontal = "horizontal"
const Vertical = "vertical"
const Negative = "negative"
const Positive = "positive"
/* constants for representing whether a line is the beginning of a three or a
** four or neither */
const Three = 3
const Four = 4
const Other = 0

/* constructors for all of the types of objects we use in this file; I didn't
** add these to the code much mostly because they would make it longer. Mostly
** I just wanted these as some kind of documentation of what each type of object
** contains. */
// constructor for gamestate from a move history
function Gamestate(rows, cols, history = [])
{
    this.rows = rows;
    this.cols = cols;
    this.history = history;
    const result = findAllLines(this);
    this.board = result.board;
    this.lines = result.lines;
    this.lines = findAllOneAway(this);
    this.turn = history.length % 2 ? White : Black;
}

// constructor for gamestate from all custom values
function GamestateCustom(rows, cols, history, board, lines, turn)
{
    this.rows = rows;
    this.cols = cols;
    this.history = history;
    this.board = board;
    this.lines = lines;
    this.turn = turn;
}

// constructor for a "node," that is, a row and column for a bourd location.
function Node(row, column)
{
    this.row = row;
    this.col = column;
}

// constructor for a line, that is, what is called a row in the rule
function Line(length, color, lineNum, lineDirection, start, end, lineAfter=undefined, lineBefore=undefined, linetype=undefined)
{
    this.length = length;
    this.color = color;
    this.lineNum = lineNum;
    this.lineDirection = lineDirection;
    this.start = start;
    this.end = end;
    this.lineAfter = lineAfter
    this.lineBefore = lineBefore
    this.lineType = lineType
}

function createBlankArray(rows, cols)
{
    let arr = [];
    for(let i = 0; i < rows; i++)
    {
        let r = [];
        for(let j = 0; j < cols; j++)
        {
            r.push({occupied:false, color: None})
        }
        arr.push(r);
    }
    return arr;
}

function createFilledArray(gamestate)
{
    const gs = gamestate;
    let arr1 = createBlankArray(gs.rows, gs.cols);
    gs.history.forEach((move, indx) => {
        let turn;
        if(indx % 2 == 0) turn = Black;
        else turn = White;
        arr1[move.row][move.col] = {occupied:true, color: turn, moveNum: indx + 1};
    });
    return arr1;
}

function iterateLine(lineDirection, node, forward = true)
{
        if(lineDirection != Vertical)
        {
            if(forward) node.col++;
            else node.col--;
        }
        if(lineDirection == Vertical || lineDirection == Negative)
        {
            if(forward) node.row++;
            else node.row--;
        }
        if(lineDirection == Positive)
        {
            if(forward) node.row--;
            else node.row++;
        }
        return node;
}

function getTableVar(node, gamestate)
{
    const gs = gamestate;
    if(!isOnTable(node.row, node.col, gs.rows, gs.cols)) 
    {
        return {occupied: true, color: None};
    }
    return gs.board[node.row][node.col];
}

function isOnTable(row, col, rows, cols)
{
    if(row < 0 || col < 0 || row > rows -1 || col > cols -1) return false;
    return true;
}


function findLine(root, gamestate, lineNum, lineDirection)
{
    let gs = gamestate;
    let currentNode = Object.assign({}, root);
    let length = 0;
    let color = getTableVar(root, gs).color;
    while(getTableVar(currentNode, gs).color === color) 
    {
        length++;
        gs.board[currentNode.row][currentNode.col][lineDirection] = lineNum;
        currentNode = iterateLine(lineDirection, currentNode)
    }
    const end = iterateLine(lineDirection, currentNode, false);
  
    currentNode = iterateLine(lineDirection, Object.assign({}, root), false);
    while(getTableVar(currentNode, gs).color === color ) 
    {
        length++;
        gs.board[currentNode.row][currentNode.col][lineDirection] = lineNum;
        currentNode = iterateLine(lineDirection, currentNode, false);
    }
    const start = iterateLine(lineDirection, currentNode);
    return {length, color, lineNum, lineDirection, start, end};
}



function findAllLines(gamestate)
{
    const board = createFilledArray(gamestate);
    const gs = Object.assign({board}, gamestate)
    let num = 1;
    let lines = [];
    gs.history.forEach((node) => {
        const tableNode = getTableVar(node, gs);
        function pushLine(lineDirection)
        {
            if(!tableNode[lineDirection]){
                const line = findLine(node, gs, num, lineDirection);
                lines.push(line);
                num++;
            }
        }
        pushLine(Horizontal);
        pushLine(Vertical);
        pushLine(Positive);
        pushLine(Negative);
    })
    return {lines, board};
}

function findOneAway(direction, line, gamestate)
{
    const gs = gamestate;
    const endCopy = Object.assign({}, line.end)
    const startCopy = Object.assign({}, line.start)
    const after = iterateLine(direction, iterateLine(direction, endCopy));
    if(isOnTable(after.row, after.col, gs.rows, gs.cols) && gs.board[after.row][after.col].color == line.color)
    {
        line.lineAfter = gs.board[after.row][after.col][direction];
    }
    const before = iterateLine(direction, iterateLine(direction, startCopy, false), false);
    if(isOnTable(before.row, before.col, gs.rows, gs.cols) && gs.board[before.row][before.col].color == line.color)
    {
        line.lineBefore = gs.board[before.row][before.col][direction];
    }
    return line;
}

function findAllOneAway(gamestate)
{
    const gs = gamestate;
    let newLines = [];
    const horizontal = gs.lines.filter(line => line.lineDirection == Horizontal);
    const vertical = gs.lines.filter(line => line.lineDirection == Vertical);
    const positive = gs.lines.filter(line => line.lineDirection == Positive);
    const negative = gs.lines.filter(line => line.lineDirection == Negative);
    horizontal.forEach(line => {newLines.push(findOneAway(Horizontal, line, gs))});
    vertical.forEach(line => {newLines.push(findOneAway(Vertical, line, gs))});
    positive.forEach(line => {newLines.push(findOneAway(Positive, line, gs))});
    negative.forEach(line => {newLines.push(findOneAway(Negative, line, gs))});
    return newLines;
}



const moveHistory = [
{row: 5, col: 4},
{row: 1, col: 8},
{row: 5, col: 5},
{row: 2, col: 9},
{row: 5, col: 6},
{row: 4, col: 11},
{row: 5, col: 8},
{row: 5, col: 12},
{row: 8, col: 11},
{row: 8, col: 1},
{row: 10, col: 9},
{row: 10, col: 1}
];

function isAvailable(node, gamestate)
{
    const gs = gamestate;
    //an occupied or nonexistant space is never allowed.
    if (getTableVar(node, gs).occupied){
        return false;
    }
    const newState = playMove(node, gs);
    //if there is a win, it is always available.
    if (newState.lines.filter(line => line.length === 5).length > 0){
        return true;
    }
    //check that there is no overline, then no threethree or fourfour.
    let out = (newState.lines.filter(line => line.length > 5).length === 0);
    out = out && !threeThree(node, gs);
    out = out && !fourFour(node, gs);
    return out;
}

function threeThree(node, gamestate)
{
    //TODO
    return false;
}

function fourFour(node, gamestate)
{
    //TODO
    return false;
}

/* given a gamestate, modify a copy of and return the lines in it so that
** threes and fours are marked. */
function identifyAll(gamestate)
{
    const gs = gamestate;
    return gs.lines.map(line =>
        //a copy of the line with the lineType added
        Object.assign({lineType: identify(line, gs)}, line
    ));
}

function identify(line, gamestate)
{
    const gs = gamestate;
    const left = iterateLine(line.lineDirection, line.start, false);
    const gap = iterateLine(line.lineDirection, line.end, true);
    if (isAvailable(gap, gs)) {
        if (line.lineAfter){
            const rightLine = gs.lines.find(l => l.lineNum === line.lineAfter);
            const right = iterateLine(line.lineDirection, rightLine.end, true);
            if (line.length === 1) {
                if (rightLine.length === 2) {
                    const newState = playMove(gap, gs);
                    if(isAvailable(left, newState) && isAvailable(right, newState)){
                        return Three; //pattern AbabbA
                    }
                } else if (rightLine.length == 3){
                    return Four; //pattern babbb
                }
            } else if (line.length === 2) {
                if (rightLine.length === 1){
                    const newState = playMove(gap, gs);
                    if(isAvailable(left, newState) && isAvailable(right, newState)){
                        return Three; //pattern AbbabA
                    }
                } else if (rightLine.length == 2){
                    return Four //pattern bbabb
                }
            } else if (line.length == 3){
                return Four //pattern bbbab
            }
        } else {
            const right = iterateLine(line.lineDirection, gap, true);
            if (line.length == 3) {
                let newState = playMove(gap, gs);
                if(isAvailable(left, newState) && isAvailable(right, newState)){
                    return Three; //patterns AəbbbəA, NəbbbaA, and æbbbaA
                } else if (isAvailable(left, gs)){
                    newState = playmove(left, gs);
                    const lefter = iterateLine(line.lineDirection, left, false);
                    if (isAvailable(lefter, newState) && isAvailable(gap, newState)){
                        return Three; //pattern AabbbəN
                    }
                }
            } else if (line.length == 4) {
                return Four; //patterns abbbba and nbbbba
            }
        }
    } else if (isAvailable(left, gs)){
        if (line.length === 3){
            const newState = playmove(left, gs);
            const lefter = iterateLine(line.lineDirection, left, false);
            if (isAvailable(lefter, newState) && isAvailable(gap, newState)){
                return Three; //pattern Aabbbæ
            }
        } else if (line.length === 4) {
            return Four; //pattern abbbbn
        }
    }
    return Other; //it fits none of the patterns
}

function playMove(node, gamestate) //give me a new gamestate after playing the set move
{//maybe we should make this more efficient.
    const gs = gamestate;
    //console.log(gs.history);
    return new Gamestate(gs.rows, gs.cols, [...gs.history, node]);
}

const testState = new Gamestate(15, 15, moveHistory);
testState.lines = identifyAll(testState);
console.log(testState.lines.filter(line => line.length > 1));

module.exports = findAllLines;

