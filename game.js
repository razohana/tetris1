document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const ROWS = 20;
    const COLS = 10;
    const BLOCK_SIZE = 30;
    const COLORS = ['#FF4136', '#FF851B', '#FFDC00', '#2ECC40', '#0074D9', '#B10DC9', '#85144b'];

    let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    let score = 0;
    let gameActive = false;
    let currentPiece = null;
    let nextPiece = null;
    let playerName = '';

    const SHAPES = [
        [[1,1,1,1]],
        [[1,1], [1,1]],
        [[1,1,1], [0,1,0]],
        [[1,1,1], [1,0,0]],
        [[1,1,1], [0,0,1]],
        [[1,1,0], [0,1,1]],
        [[0,1,1], [1,1,0]]
    ];

    let difficulty = 'easy';
    let gameSpeed = 1000;

    const backgroundMusic = document.getElementById('backgroundMusic');
    const moveSound = document.getElementById('moveSound');
    const rotateSound = document.getElementById('rotateSound');
    const lineClearSound = document.getElementById('lineClearSound');
    const gameOverSound = document.getElementById('gameOverSound');

    function playSound(sound) {
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.error('Error playing sound:', e));
        }
    }

    function drawBlock(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.lineTo((x + 1) * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.lineTo(x * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.moveTo((x + 1) * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.lineTo((x + 1) * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
        ctx.lineTo(x * BLOCK_SIZE, (y + 1) * BLOCK_SIZE);
        ctx.closePath();
        ctx.fill();
    }

    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (board[row][col]) {
                    drawBlock(col, row, board[row][col]);
                }
            }
        }
        if (currentPiece) {
            drawPiece(currentPiece);
        }
    }

    function drawPiece(piece) {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(piece.col + x, piece.row + y, piece.color);
                }
            });
        });
    }

    function drawNextPiece() {
        const nextPieceCanvas = document.getElementById('nextPieceCanvas');
        const nextCtx = nextPieceCanvas.getContext('2d');
        nextCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);

        nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    nextCtx.fillStyle = nextPiece.color;
                    nextCtx.fillRect(x * 30 + 15, y * 30 + 15, 30, 30);
                    nextCtx.strokeStyle = 'white';
                    nextCtx.strokeRect(x * 30 + 15, y * 30 + 15, 30, 30);
                }
            });
        });
    }

    function createPiece() {
        const shapeIndex = Math.floor(Math.random() * SHAPES.length);
        return {
            shape: SHAPES[shapeIndex],
            color: COLORS[shapeIndex],
            row: 0,
            col: Math.floor(COLS / 2) - Math.floor(SHAPES[shapeIndex][0].length / 2)
        };
    }

    function movePiece(dir) {
        currentPiece.col += dir;
        if (checkCollision()) {
            currentPiece.col -= dir;
            return false;
        }
        playSound(moveSound);
        drawBoard();
        return true;
    }

    function rotatePiece() {
        const rotated = currentPiece.shape[0].map((_, i) => 
            currentPiece.shape.map(row => row[i]).reverse()
        );
        const previousShape = currentPiece.shape;
        currentPiece.shape = rotated;
        if (checkCollision()) {
            currentPiece.shape = previousShape;
            return false;
        }
        playSound(rotateSound);
        drawBoard();
        return true;
    }

    function checkCollision() {
        return currentPiece.shape.some((row, dy) => {
            return row.some((value, dx) => {
                let newX = currentPiece.col + dx;
                let newY = currentPiece.row + dy;
                return (
                    value && 
                    (newX < 0 || newX >= COLS || 
                     newY >= ROWS || 
                     (newY >= 0 && board[newY][newX]))
                );
            });
        });
    }

    function mergePiece() {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    board[currentPiece.row + y][currentPiece.col + x] = currentPiece.color;
                }
            });
        });
    }

    function clearLines() {
        let linesCleared = 0;
        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row].every(cell => cell !== 0)) {
                board.splice(row, 1);
                board.unshift(Array(COLS).fill(0));
                linesCleared++;
                row++;
            }
        }
        if (linesCleared > 0) {
            playSound(lineClearSound);
            updateScore(linesCleared);
        }
    }

    function updateScore(linesCleared) {
        const points = [0, 40, 100, 300, 1200];
        score += points[linesCleared] * (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3);
        document.getElementById('score').innerText = `Score: ${score}`;
    }

    function gameLoop() {
        if (!gameActive) return;
        
        currentPiece.row++;
        if (checkCollision()) {
            currentPiece.row--;
            mergePiece();
            clearLines();
            currentPiece = nextPiece;
            nextPiece = createPiece();
            drawNextPiece();
            if (checkCollision()) {
                gameOver();
                return;
            }
        }
        
        drawBoard();
        
        setTimeout(() => requestAnimationFrame(gameLoop), gameSpeed);
    }

    function gameOver() {
        gameActive = false;
        if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        }
        playSound(gameOverSound);
        document.getElementById('gameContainer').style.display = 'none';
        document.getElementById('endScreen').style.display = 'flex';
        document.getElementById('finalScore').innerText = `${playerName}, your score is: ${score}`;
    }

    function setDifficulty(newDifficulty) {
        difficulty = newDifficulty;
        gameSpeed = difficulty === 'easy' ? 1000 : difficulty === 'medium' ? 500 : 200;
    }

    function startGame() {
        playerName = document.getElementById('playerName').value || 'Player';
        setDifficulty(document.getElementById('difficultySelect').value);
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'flex';
        resetGame();
        gameActive = true;
        if (backgroundMusic) {
            backgroundMusic.play().catch(e => console.error('Error playing music:', e));
        }
        requestAnimationFrame(gameLoop);
    }

    function resetGame() {
        board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        score = 0;
        updateScore(0);
        currentPiece = createPiece();
        nextPiece = createPiece();
        drawNextPiece();
        document.getElementById('endScreen').style.display = 'none';
        gameActive = true;
    }

    document.addEventListener('keydown', event => {
        if (!gameActive) return;
        switch(event.keyCode) {
            case 37: // left
                movePiece(-1);
                break;
            case 39: // right
                movePiece(1);
                break;
            case 40: // down
                currentPiece.row++;
                if (checkCollision()) {
                    currentPiece.row--;
                    mergePiece();
                    clearLines();
                    currentPiece = nextPiece;
                    nextPiece = createPiece();
                    drawNextPiece();
                    if (checkCollision()) {
                        gameOver();
                    }
                }
                drawBoard();
                break;
            case 38: // up (rotate)
                rotatePiece();
                break;
        }
    });

    // Initial setup
    nextPiece = createPiece();
    drawNextPiece();

    // Event listeners for buttons
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', () => {
        document.getElementById('endScreen').style.display = 'none';
        startGame();
    });
});