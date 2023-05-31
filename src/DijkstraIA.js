///
class DijkstraIAPlayer extends Agent {
  constructor() {
    super();
    this.board = new Board();
    this.memo = {};
  }

  compute(board, time) {
    if(time < 500){
      var moves = this.board.valid_moves(board, this.color);
      var index = Math.floor(moves.length * Math.random());
      return moves[index];
    }
    let depth = this.calculateDepth(board, time);
    let bestMove = this.minimax(
      board,
      this.color,
      depth,
      -Infinity,
      Infinity
    ).move;
    return bestMove;
  }

  calculateDepth(board, remainingTime) {
    let depth = 1;
    if (board.length <= 5) {
      depth = 10;
    }
    else if (board.length <= 6) {
      depth = 5;
    } else if (board.length <= 15) {
      depth = 3;
    } else {
      depth = 2;
    }

    if(board.length < 20){
      if(remainingTime > 8000){
        depth += 1;
      }
      if(remainingTime < 5000){
        depth = 2;
      }
    }
    else if(board.length <= 40) {
      if(remainingTime > 8000){
        depth += 1;
      }
      if(remainingTime < 10000){
        depth = 2;
      }
    }
    else{
      depth = 2;
    }

    let possibleMoves = this.board.valid_moves(board, this.color).length;
    if (possibleMoves <= 5) {
      depth += 2;
    }
    else if(possibleMoves <= 10){
      depth += 1;
    }
    else{
      depth -= 1;
    }

    
    if(board.length >= 30 && remainingTime <= 5000){
      return 1;
    }
    else if(remainingTime < 2500)
    {
      return 2;
    }
    else{
      return Math.max(depth, 2);
    }
  }

  minimax(board, player, depth, alpha, beta) {
    let opponent = player === "W" ? "B" : "W";
    let validMoves = this.board.valid_moves(board, player);
    let validMovesopponent = this.board.valid_moves(board, opponent);

    let key = board.toString() + player + depth + alpha + beta;

    if (this.memo.hasOwnProperty(key)) {
      return this.memo[key];
    }

    if (depth === 0 || (validMoves.length === 0 && validMovesopponent.length == 0)) {
      return { score: this.evaluateBoard(board) };
    }

    if(validMoves.length === 0){
      return {
          score:
            this.minimax(
            board,
            opponent,
            depth,
            alpha,
            beta
          ).score
      }
    }

    let bestValue = {
      score: player === this.color ? -Infinity : Infinity
    };
    for (let move of validMoves) {
      // let randomIndex = Math.floor(Math.random() * validMoves.length);
      // let move = validMoves[randomIndex];
      // validMoves.splice(randomIndex, 1);
      let newBoard = this.board.clone(board);
      this.board.move(newBoard, move[0], move[1], player);
      let value = this.minimax(
        newBoard,
        opponent,
        depth - 1,
        alpha,
        beta
      );

      if (player === this.color) {
        if (value.score > bestValue.score) {
          bestValue.score = value.score;
          bestValue.move = move;
        }
        alpha = Math.max(alpha, value.score);
      } else {
        if (value.score < bestValue.score) {
          bestValue.score = value.score;
          bestValue.move = move;
        }
        beta = Math.min(beta, value.score);
      }

      if (alpha > beta) break;
    }

    this.memo[key] = bestValue;

    return bestValue;
  }

  evaluateBoard(board) {
    let opponent = this.color === "W" ? "B" : "W";
    let myValidMoves = this.board.valid_moves(board, this.color).length;
    let opponentValidMoves = this.board.valid_moves(
      board,
      opponent
    ).length;
    let mobilityScore = myValidMoves - opponentValidMoves;
    let corners = [
      [0, 0],
      [0, board.length - 1],
      [board.length - 1, 0],
      [board.length - 1, board.length - 1]
    ];

    let cornerScore = 1;
    for (let corner of corners) {
      if (board[corner[0]][corner[1]] === this.color) {
        cornerScore += 1;
      } else if (board[corner[0]][corner[1]] === opponent) {
        cornerScore -= 1;
      }
    }
    let borderScore = 0;
    for (let i = 0; i < board.length; i++) {
      if (board[i][0] === this.color && !corners.includes([i, 0])) {
        borderScore += 1;
      } else if (board[i][0] === opponent && !corners.includes([i, 0])) {
        borderScore -= 1;
      }
      if (
        board[i][board.length - 1] === this.color &&
        !corners.includes([i, board.length - 1])
      ) {
        borderScore += 1;
      } else if (
        board[i][board.length - 1] === opponent &&
        !corners.includes([i, board.length - 1])
      ) {
        borderScore -= 1;
      }
      if (board[0][i] === this.color && !corners.includes([0, i])) {
        borderScore += 1;
      } else if (board[0][i] === opponent && !corners.includes([0, i])) {
        borderScore -= 1;
      }
      if (
        board[board.length - 1][i] === this.color &&
        !corners.includes([board.length - 1, i])
      ) {
        borderScore += 1;
      } else if (
        board[board.length - 1][i] === opponent &&
        !corners.includes([board.length - 1, i])
      ) {
        borderScore -= 1;
      }
    }
    
    let stabilityScore = 0
    if(mobilityScore <= -2){
        let directions = [
          [-1, -1],
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
          [1, 1]
        ];
        for (let i = 0; i < board.length; i++) {
          for (let j = 0; j < board[i].length; j++) {
            if (board[i][j] === this.color || board[i][j] === opponent) {
              let stable = true;
              for (let direction of directions) {
                let x = i + direction[0];
                let y = j + direction[1];
                while (
                  x >= 0 &&
                  x < board.length &&
                  y >= 0 &&
                  y < board[i].length
                ) {
                  if (board[x][y] === " ") {
                    stable = false;
                    break;
                  }
                  x += direction[0];
                  y += direction[1];
                }
                if (!stable) break;
              }
              if (stable) {
                stabilityScore += board[i][j] === this.color ? 1 : -1;
              }
            }
          }
        }
    }
    let weights = this.calculateWeights(board);
    return (
      mobilityScore * weights.mobilityWeight +
      cornerScore * weights.cornerWeight +
      borderScore * weights.borderWeight +
      stabilityScore * weights.stabilityWeight
    );
  }

  countEmptySquares(board) {
    let emptySquares = 0;
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === " ") {
          emptySquares += 1;
        }
      }
    }
    return emptySquares;
  }

  calculateStage(board) {
  let opponent = this.color === "W" ? "B" : "W";
  let stage;
  let numDisks = this.countDisks(board, this.color) + this.countDisks(board, opponent);
  let porcentaje = numDisks / (board.length * board.length);
  let low = 0.3;
  let medium = 0.5;
  if (numDisks <= low) {
    stage = 'early';
  } else if (numDisks <= medium) {
    stage = 'mid';
  } else {
    stage = 'late';
  }
  return stage;
}

  calculateWeights(board) {
    let opponent = this.color === "W" ? "B" : "W";
    let weights = {
      mobilityWeight: 1,
      stabilityWeight: 2,
      borderWeight: 3,
      cornerWeight: 4,
    };

    let myDisks = this.countDisks(board, this.color);
    let opponentDisks = this.countDisks(board, opponent);
    let diskDiff = myDisks - opponentDisks;
    let stage = this.calculateStage(board);
    let plus = 0;
    if(diskDiff < 0){
        plus = 10;
    }
    if (stage === 'early') {
      weights.mobilityWeight = 5;
      weights.stabilityWeight = 1;
      weights.borderWeight = 1 + plus;
      weights.cornerWeight = 0 + plus;
    } else if (stage === 'mid') {
      weights.mobilityWeight = 1;
      weights.stabilityWeight = 1;
      weights.borderWeight = 5 + plus;
      weights.cornerWeight = 10 + plus;
    }
    else{
      weights.mobilityWeight = 0;
      weights.stabilityWeight = 10;
      weights.borderWeight = 5 + plus;
      weights.cornerWeight = 5 + plus;
    }

    return weights;
  }

  countDisks(board, color) {
    let disks = 0;
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === color) {
          disks += 1;
        }
      }
    }
    return disks;
  }
}
///