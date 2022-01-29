function createBlankArray(rows, cols){
    let arr = [];
    for(let i = 0; i < rows; i++)
    {
        let r = [];
        for(let j = 0; j < cols; j++)
        {
            r.push({occupied:false, type: "none"})
        }
        arr.push(r);
    }
    return arr;
}

function createFilledArray(rows, cols, history)
{
    let arr1 = createBlankArray(rows, cols);
    history.forEach((move, indx) => {
        let turn;
        if(indx % 2 == 0) turn = "black";
        else turn = "white";
        arr1[move.row][move.col] = {occupied:true, type: turn, moveNum: indx + 1};
    });
    return arr1;
}

function iterateLine(linetype, node, forward = true)
{
        if(linetype != "vertical")
        {
            if(forward) node.col++;
            else node.col--;
        }
        if(linetype == "vertical" || linetype =="negative")
        {
            if(forward) node.row++;
            else node.row--;
        }
        if(linetype == "positive")
        {
            if(forward) node.row--;
            else node.row++;
        }
        return node;
}

function getTableVar(node, rows, cols, board)
{
    if(!isOnTable(node.row, node.col, rows, cols)) 
    {
        return {type: "none"};
    }
    return board[node.row][node.col];
}

function isOnTable(row, col, rows, cols)
{
    if(row < 0 || col < 0 || row > rows -1 || col > cols -1) return false;
    return true;
}


function findLine(root, board, rows, cols, lineNum, linetype)
{
    let currentNode = Object.assign({}, root);
    let length = 0;
    let color = getTableVar(root, rows, cols, board).type;
    while(getTableVar(currentNode, rows, cols, board).type === color) 
    {
        length++;
        board[currentNode.row][currentNode.col][linetype] = lineNum;
        currentNode = iterateLine(linetype, currentNode)
    }
    const end = iterateLine(linetype, currentNode, false);
  
    currentNode = iterateLine(linetype, Object.assign({}, root), false);
    while(getTableVar(currentNode, rows, cols, board).type === color ) 
    {
        length++;
        board[currentNode.row][currentNode.col][linetype] = lineNum;
        currentNode = iterateLine(linetype, currentNode, false);
    }
    const start = iterateLine(linetype, currentNode);
    return {length, color, lineNum, linetype, start, end};
}



function findAllLines(moveHistory, rows, cols)
{
    const board = createFilledArray(rows, cols, moveHistory);
    let num = 1;
    lines = [];
    moveHistory.forEach((node) => {
        const tableNode = getTableVar(node, rows, cols, board);
        function pushLine(linetype)
        {
            if(!tableNode[linetype]){
                const line = findLine(node, board, rows, cols, num, linetype);
                lines.push(line);
                num++;
            }
        }
        pushLine("horizontal");
        pushLine("vertical");
        pushLine("positive");
        pushLine("negative");
    })
    return {lines, board};
}

function findOneAway(type, line, lines, board, rows, cols)
{
    const endCopy = Object.assign({}, line.end)
    const startCopy = Object.assign({}, line.start)
    // if(line.lineNum == 1)
    const after = iterateLine(type, iterateLine(type, endCopy));
    if(line.lineNum == 1) console.log(after);
    if(isOnTable(after.row, after.col, rows, cols) && board[after.row][after.col].type == line.color)
    {
        line.lineAfter = board[after.row][after.col][type];
    }
    const before = iterateLine(type, iterateLine(type, startCopy, false), false);
    // if(line.lineNum == 1){
    //     console.log(before)
    //     console.log(board[line.start.row][line.start.col])
    //     console.log(board[after.row][after.col])
    // }
    if(isOnTable(before.row, before.col, rows, cols) && board[before.row][before.col].type == line.color)
    {
        line.lineBefore = board[before.row][before.col][type];
    }
    return line;
}

function findAllOneAway(lines, board, rows, cols)
{
    let newLines = [];
    const horizontal = lines.filter(line => line.linetype == "horizontal");
    const vertical = lines.filter(line => line.linetype == "vertical");
    const positive = lines.filter(line => line.linetype == "positive");
    const negative = lines.filter(line => line.linetype == "negative");
    horizontal.forEach(line => {newLines.push(findOneAway("horizontal", line, horizontal, board, rows, cols))});
    vertical.forEach(line => {newLines.push(findOneAway("vertical", line, vertical, board, rows, cols))});
    positive.forEach(line => {newLines.push(findOneAway("positive", line, positive, board, rows, cols))});
    negative.forEach(line => {newLines.push(findOneAway("negative", line, negative, board, rows, cols))});
    return newLines;
}

moveHistory = [
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
]

const result = findAllLines(moveHistory, 15, 15);
const oneAway = findAllOneAway(result.lines, result.board, 15, 15);
console.log(oneAway);
console.log(result.lines[0]);

module.exports = findAllLines;

