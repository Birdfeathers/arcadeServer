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

function returnLeftNode(node) {
    node.col = node.col -1;
    return node;
}

function returnRightNode(node) {
    node.col = node.col  + 1;
    return node;
}

function returnUpNode(node){
    node.row = node.row - 1;
    return node;
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
  
    currentNode = iterateLine(linetype, Object.assign({}, root), false);
    while(getTableVar(currentNode, rows, cols, board).type === color ) 
    {
        length++;
        board[currentNode.row][currentNode.col][linetype] = lineNum;
        currentNode = iterateLine(linetype, currentNode, false);
    }

    return {length, color, lineNum, linetype};
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

module.exports = findAllLines;

// let moveHistory = [
//     {row: 4, col: 6},
//     {row: 2, col: 3},
//     {row: 4, col: 9},
//     {row: 1, col: 5},
//     {row: 4, col: 8},
//     {row: 1, col: 3},
//     {row: 4, col: 5},
//     {row: 1, col: 2},
//     {row: 4, col: 7},
//     {row: 3, col: 7},
//     {row: 5, col: 6},
//     {row: 1, col: 1},
//     {row: 3, col: 6},
//     {row: 1, col: 0}

// ]





// function createBlankArray(rows, cols){
//     let arr = [];
//     for(let i = 0; i < rows; i++)
//     {
//         let r = [];
//         for(let j = 0; j < cols; j++)
//         {
//             r.push({occupied:false, type: "none"})
//         }
//         arr.push(r);
//     }
//     return arr;
// }

// function createFilledArray(rows, cols, history)
// {
//     let arr1 = createBlankArray(rows, cols);
//     history.forEach((move, indx) => {
//         let turn;
//         if(indx % 2 == 0) turn = "black";
//         else turn = "white";
//         arr1[move.row][move.col] = {occupied:true, type: turn, moveNum: indx + 1};
//     });
//     return arr1;
// }

//let board = createFilledArray(15, 15, moveHistory);
// console.log(findAllLines(moveHistory, 15, 15, board));

