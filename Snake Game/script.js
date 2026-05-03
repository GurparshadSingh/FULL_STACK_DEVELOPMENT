const board = document.querySelector('.board');
const blockSize = 30;

const cols = Math.floor(board.clientWidth / blockSize);
const rows = Math.floor(board.clientHeight / blockSize);

let intervalId;
let direction = 'right';

//  correct food coords
let food = {
    x: Math.floor(Math.random() * cols),
    y: Math.floor(Math.random() * rows)
};

const blocks = {};
const snake = [{ x: 5, y: 5 }];
// ! x column and y row


// create grid
for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const block = document.createElement('div');
        block.classList.add('block');
        board.appendChild(block);
        blocks[`${row},${col}`] = block;
    }
}

//  MAIN GAME LOOP
function render() {
    let head;

    // movement
    if (direction === 'up') head = { x: snake[0].x, y: snake[0].y - 1 };
    if (direction === 'down') head = { x: snake[0].x, y: snake[0].y + 1 };
    if (direction === 'left') head = { x: snake[0].x - 1, y: snake[0].y };
    if (direction === 'right') head = { x: snake[0].x + 1, y: snake[0].y };

    //  wall collision
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
        clearInterval(intervalId);
        alert("Game Over");
        return;
    }

    //  self collision
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            clearInterval(intervalId);
            alert("Game Over");
            return;
        }
    }

    // clear snake
    snake.forEach(seg => {
        blocks[`${seg.y},${seg.x}`].classList.remove("fill");
    });

    //  FOOD LOGIC
    if (head.x === food.x && head.y === food.y) {
        // grow
        snake.unshift(head);

        // new food
        food = {
            x: Math.floor(Math.random() * cols),
            y: Math.floor(Math.random() * rows)
        };
    } else {
        snake.unshift(head);
        snake.pop(); // normal move
    }

    // clear ALL food first
    document.querySelectorAll('.food').forEach(f => f.classList.remove('food'));

    // draw food
    blocks[`${food.y},${food.x}`].classList.add("food");

    // draw snake
    snake.forEach(seg => {
        blocks[`${seg.y},${seg.x}`].classList.add("fill");
    });
}

// start game
intervalId = setInterval(render, 200);

//  controls 
addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" && direction !== 'down') direction = 'up';
    if (event.key === "ArrowDown" && direction !== 'up') direction = 'down';
    if (event.key === "ArrowLeft" && direction !== 'right') direction = 'left';
    if (event.key === "ArrowRight" && direction !== 'left') direction = 'right';
});