'use strict';

const { statement_timeout } = require("pg/lib/defaults");

/* below are some enum-like constants - I changed references to the constants
** into references to these vars to avoid magic numbers. */
// constants representing stone colors
const White = "white";
const Black = "black";
const None = "none";
// constants for representing line dir;ections
const Horizontal = "horizontal";
const Vertical = "vertical";
const Negative = "negative";
const Positive = "positive";

/* constants for representing whether a line is the beginning of a three or a
** four or neither */
const Three = 3;
const Four = 4;
const Other = 0;

const noRestrictions = Object.freeze({
    overline: false,
    threeThree: false,
    fourFour: false
});
const allRestrictions = Object.freeze({
    overline: true,
    threeThree: true,
    fourFour: true
});

/* constructors for all of the types of objects we use in this file; I didn't
** add these to the code much mostly because they would make it longer. Mostly
** I just wanted these as some kind of documentation of what each type of
** object contains. For any of these "classes" you should just be able to use
** any objects that have properties with the correct names and types. Maybe in
** the future I will replace contructors with factory functions. */
/**
 * factory function for gamestate from a move history and board size alone.
 * This function automatically calls findAllLines and findAllOneAway on the new
 * gamestate.
 * @param {number} rows A positive integer representing the number of rows the
 * board has.
 * @param {number} cols A positive integer representing the number of columns
 * the board has.
 * @param {Node[]} history A list of all moves played in the game so far.
 * @returns {Gamestate}
 */
function constructGamestate(rows, cols, history = [])
{
    let state = {rows, cols, history};
    const result = findAllLines(state);
    state.board = result.board;
    state.lines = result.lines;
    state.lines = findAllOneAway(state);
    state.turn = history.length % 2 ? White : Black;
    return state;
}


/**A gamestate represents the abstract state that the actual board
 * is in - the history of moves, the current state of the board, the board
 * size, and any other information useful for abstractly calculating actual
 * rules or strategies of the game. It does not contain other information such
 * as the players or time control information.
 * @typedef Gamestate
 * @property {number} rows
 * @property {number} cols
 * @property {Node[]} history
 * @property {Location[][]} board
 * @property {Line[]} lines
 * @property {string} turn whose turn it is
 */

// constructor for a "node," that is, a row and column for a bourd location.
function Node(row, column)
{
    this.row = row;
    this.col = column;
}

// constructor for a line, that is, what is called a row in the rule
function Line(length, color, lineNum, lineDirection, start, end, lineAfter=undefined, lineBefore=undefined, lineType=undefined)
{
    this.length = length;
    this.color = color;
    this.lineNum = lineNum;
    this.lineDirection = lineDirection;
    this.start = start;
    this.end = end;
    this.lineAfter = lineAfter;
    this.lineBefore = lineBefore;
    this.lineType = lineType;
}

/**A simple object for keeping track of which restrictions you want to place
 * on Black, or to keep track of for the purposes of threes and fours.
 * @typedef Restrictions
 * @property {boolean} overline
 * @property {boolean} threeThree
 * @property {boolean} fourFour
 */

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
        arr1[move.row][move.col] = {occupied:true, color: turn, moveNum: indx + 1, future: move.future};
    });
    return arr1;
}

function iterateLine(lineDirection, node, forward = true)
{
        if(lineDirection !== Vertical)
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

// returns a value saying which restrictions a move violated of the form
// {overline, threeThree, fourFour}, all bools, true if violated.
function violations(gamestate)
{
    //check whether there is any overline, then three-three or four-four.
    const overline = (gamestate.lines.filter(line => line.length > 5).length !== 0);
    const threeThree = checkThreeThree(gamestate);
    const fourFour = checkFourFour(gamestate);
    return {overline, threeThree, fourFour};
}

// pass in a value saying which restrictions you want created with the
// Restrictions constructor.
function isAvailable(node, gamestate, restrictions = allRestrictions)
{   
    const gs = gamestate;
    //an occupied or nonexistant space is never allowed.
    if (getTableVar(node, gamestate).occupied) return false;
    const newState = playMove(node, gs); //this should really be returned or smth
    //if there is a win, it is always available.
    if (newState.lines.filter(line => line.length === 5).length > 0){
        return true;
    }
    // otherwise check that the violations are not true if they are restricted.
    const viols = violations(newState, restrictions);
    const out = !(restrictions.overline && viols.overline)
        && !(restrictions.threeThree && viols.threeThree)
        && !(restrictions.fourFour && viols.fourFour);
    return out;
}

function checkThreeThree(gamestate)
{
    const lalb = linesAndLinesBefore(gamestate);
    const fours = lalb.filter(line => line.lineType == Three);
    return fours.length >= 2;
}

function checkFourFour(gamestate)
{
    const lalb = linesAndLinesBefore(gamestate);
    const fours = lalb.filter(line => line.lineType == Four);
    return fours.length >= 2;
}

/**
 *
 * @param {Node} node 
 * @param {Gamestate} gamestate 
 * @return {Line[]} The lines in gamestate that contain node, as well as any
 * lines that precede them with a gap of 1, ignoring 4s that already existed.
 */
function linesAndLinesBefore(gamestate)
{
    const dirs = [Horizontal, Vertical, Positive, Negative];
    const gs = gamestate;
    const node = gamestate.history[gamestate.history.length - 1];
    const stone = getTableVar(node, gs);
    if (stone.color === None) return [];
    //get the lines corresponding to the numbers stored in stone
    let lines = dirs.map(dir =>
        gs.lines.find(line => line.lineNum === stone[dir])
    );
    //check for lines that have preceding line, then get those lines, unless
    //they may be fours that already existed
    //TODO fours here may not work with longer lines?
    let linesBefore = lines
        .filter(line => line.lineBefore)
        .map(lineCurrent =>
            gs.lines.find(line =>
                line.lineNum === lineCurrent.lineBefore
            )
        )
        .filter(line => line.length !== 4)
    return [...lines, ...linesBefore];
}

/* given a gamestate, modify a copy of and return the lines in it so that
** threes and fours are marked. */
function identifyAll(gamestate, restrictions = allRestrictions)
{
    const gs = gamestate;
    return gs.lines.map(line =>
        //a copy of the line with the lineType added
        Object.assign({lineType: identify(line, gs, restrictions)}, line)
    );
}

function identify(line, gamestate, restrictions = allRestrictions)
{
    const gs = gamestate;
    const left = iterateLine(line.lineDirection, line.start, false);
    const gap = iterateLine(line.lineDirection, line.end, true);
    /* below is some ugly logic for detecting patterns for threes and fours;
    ** I do not know how to make it prettier*/
    //todo new four patterns if restrictions.overline is false
    if (isAvailable(gap, gs, restrictions)) {
        if (line.lineAfter){
            const rightLine = gs.lines.find(l => l.lineNum === line.lineAfter);
            const right = iterateLine(line.lineDirection, rightLine.end, true);
            if (line.length === 1) {
                if (rightLine.length === 2) {
                    const newState = playMove(gap, gs);
                    if(isAvailable(left, newState, restrictions)
                        && isAvailable(right, newState, restrictions)){
                        return Three; //pattern AbabbA
                    }
                } else if (rightLine.length == 3){
                    return Four; //pattern babbb
                }
            } else if (line.length === 2) {
                if (rightLine.length === 1){
                    const newState = playMove(gap, gs);
                    if(isAvailable(left, newState, restrictions)
                        && isAvailable(right, newState, restrictions)){
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
                if(isAvailable(left, newState, restrictions)
                    && isAvailable(right, newState, restrictions)){
                    return Three; //patterns AəbbbəA, NəbbbaA, and æbbbaA
                } else if (isAvailable(left, gs, restrictions)){
                    newState = playMove(left, gs);
                    const lefter = iterateLine(line.lineDirection, left, false);
                    if (isAvailable(lefter, newState, restrictions)
                        && isAvailable(gap, newState, restrictions)){
                        return Three; //pattern AabbbəN
                    }
                }
            } else if (line.length == 4) {
                return Four; //patterns abbbba and nbbbba
            }
        }
    } else if (isAvailable(left, gs, restrictions)){
        if (line.length === 3){
            const newState = playMove(left, gs);
            const lefter = iterateLine(line.lineDirection, left, false);
            if (isAvailable(lefter, newState, restrictions)
                && isAvailable(gap, newState, restrictions)){
                return Three; //pattern Aabbbæ
            }
        } else if (line.length === 4) {
            return Four; //pattern abbbbn
        }
    }
    return Other; //it fits none of the patterns
}

//give me a new gamestate after playing the set move
function playMove(node, gamestate)
{//maybe we should make this more efficient.
    const gs = gamestate;
    return constructGamestate(gs.rows, gs.cols, [...gs.history, node]);
}

const testState = constructGamestate(15, 15, moveHistory);
testState.lines = identifyAll(testState, allRestrictions);

function checkViolations(history, rows, cols, restrictions)
{
    let state = constructGamestate(rows, cols, history);
    state.lines = identifyAll(state, restrictions);
    return violations(state);

}

const threeThreeHistory = [
    {row: 6, col: 7},
    {row: 1, col: 3},
    {row: 5, col: 7},
    {row: 1, col: 4},
    {row: 6, col: 8},
    {row: 1, col: 5},
    {row: 5, col: 9},
    {row: 1, col: 6},
    {row: 7, col: 7}
]

const fourFourHistory = [
    {row: 6, col: 7},
    {row: 0, col: 2},
    {row: 5, col: 7},
    {row: 0, col: 3},
    {row: 4, col: 7},
    {row: 0, col: 4},
    {row: 7, col: 8},
    {row: 0, col: 5},
    {row: 7, col: 9},
    {row: 14, col: 2},
    {row: 7, col: 10},
    {row: 14, col: 3},
    {row: 7, col: 7}
]

const overlineHistory = [
    {row: 6, col: 6},
    {row: 0, col: 5},
    {row: 6, col: 7},
    {row: 0, col: 6},
    {row: 6, col: 9},
    {row: 0, col: 7},
    {row: 6, col: 10},
    {row: 0, col: 8},
    {row: 6, col: 11},
    {row: 2, col: 2},
    {row: 6, col: 8}
]

module.exports = {findAllLines, checkViolations};

