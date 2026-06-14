const TOTAL_QUESTIONS = 5;
let currentQuestionIndex = 0;
let p1Score = 0;
let p2Score = 0;
let expectedAnswer = null;
let gameState = 'START'; // START, PLAYING, ENDED

// Input states
let p1Input = "";
let p2Input = "";

// Elements
const questionDisplay = document.getElementById('question-display');
const questionCounter = document.getElementById('question-counter');
const p1Display = document.getElementById('p1-display');
const p2Display = document.getElementById('p2-display');
const p1ScoreEl = document.getElementById('p1-score');
const p2ScoreEl = document.getElementById('p2-score');
const knot = document.getElementById('rope-knot');

const overlay = document.getElementById('overlay');
const startModal = document.getElementById('start-modal');
const winnerModal = document.getElementById('winner-modal');
const singlePlayerBtn = document.getElementById('single-player-btn');
const twoPlayerBtn = document.getElementById('two-player-btn');
const restartBtn = document.getElementById('restart-btn');
const winnerText = document.getElementById('winner-text');
const finalScores = document.getElementById('final-scores');
const timerDisplay = document.getElementById('timer-display');
const p2CalcContainer = document.getElementById('p2-calc-container');
const p2Name = document.getElementById('p2-name');

let gameMode = 'MULTI';
let timerInterval = null;
let timeLeft = 5;

// Keyboard mappings
const p1Keys = {
    'q': '7', 'w': '8', 'e': '9',
    'a': '4', 's': '5', 'd': '6',
    'z': '1', 'x': '2', 'c': '3',
    ' ': '0',
    'Shift': 'enter',
    'Backspace': 'clear' // Optional, for clearing
};

const p2Keys = {
    'Numpad7': '7', 'Numpad8': '8', 'Numpad9': '9',
    'Numpad4': '4', 'Numpad5': '5', 'Numpad6': '6',
    'Numpad1': '1', 'Numpad2': '2', 'Numpad3': '3',
    'Numpad0': '0',
    'NumpadEnter': 'enter',
    'NumpadDecimal': 'clear'
};

// Event Listeners for UI Buttons
singlePlayerBtn.addEventListener('click', () => startGame('SINGLE'));
twoPlayerBtn.addEventListener('click', () => startGame('MULTI'));
restartBtn.addEventListener('click', () => {
    overlay.classList.remove('hidden');
    winnerModal.classList.add('hidden');
    startModal.classList.remove('hidden');
});

document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (gameState !== 'PLAYING') return;
        const player = e.target.getAttribute('data-player');
        const val = e.target.getAttribute('data-val');
        handleInput(player, val);
    });
});

// Keyboard Listeners
document.addEventListener('keydown', (e) => {
    if (gameState !== 'PLAYING') return;

    // Prevent default actions for some keys like space scrolling
    if (e.key === ' ' || e.code === 'NumpadEnter') {
        e.preventDefault();
    }

    // Check P1
    const p1Val = p1Keys[e.key] || (e.key === 'Shift' && e.location === 1 ? 'enter' : null);
    if (p1Val) {
        animateButton(1, p1Val);
        handleInput('1', p1Val);
    }

    // Check P2
    const p2Val = p2Keys[e.code];
    if (p2Val) {
        animateButton(2, p2Val);
        handleInput('2', p2Val);
    }
});

function animateButton(player, val) {
    const btn = document.querySelector(`.calc-btn[data-player="${player}"][data-val="${val}"]`);
    if (btn) {
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 100);
    }
}

function startGame(mode) {
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(e => console.log("Orientation lock not supported or allowed here."));
    }
    gameMode = mode;
    p1Score = 0;
    p2Score = 0;
    currentQuestionIndex = 0;
    p1Input = "";
    p2Input = "";
    gameState = 'PLAYING';
    
    if (gameMode === 'SINGLE') {
        p2CalcContainer.classList.add('hidden');
        p2Name.innerText = 'CPU';
        timerDisplay.classList.remove('hidden');
    } else {
        p2CalcContainer.classList.remove('hidden');
        p2Name.innerText = 'Player 2';
        timerDisplay.classList.add('hidden');
    }

    updateDisplays();
    updateScores();
    updateRope();
    
    overlay.classList.add('hidden');
    startModal.classList.add('hidden');
    winnerModal.classList.add('hidden');
    
    generateQuestion();
}

function generateQuestion() {
    if (timerInterval) clearInterval(timerInterval);

    if (currentQuestionIndex >= TOTAL_QUESTIONS) {
        endGame();
        return;
    }

    currentQuestionIndex++;
    questionCounter.innerText = `Question: ${currentQuestionIndex}/${TOTAL_QUESTIONS}`;
    
    const ops = ['+', '-', '*'];
    // Adding division with clean integers
    const op = ops[Math.floor(Math.random() * ops.length)];
    
    let a, b;
    if (op === '+') {
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 20) + 1;
        expectedAnswer = a + b;
    } else if (op === '-') {
        a = Math.floor(Math.random() * 20) + 10;
        b = Math.floor(Math.random() * 10) + 1;
        expectedAnswer = a - b;
    } else if (op === '*') {
        a = Math.floor(Math.random() * 10) + 2;
        b = Math.floor(Math.random() * 10) + 2;
        expectedAnswer = a * b;
    } else if (op === '/') {
        b = Math.floor(Math.random() * 9) + 2;
        expectedAnswer = Math.floor(Math.random() * 10) + 2;
        a = b * expectedAnswer;
    }

    questionDisplay.innerText = `${a} ${op} ${b} = ?`;
    
    // Reset inputs for new question
    p1Input = "";
    p2Input = "";
    updateDisplays();

    if (gameMode === 'SINGLE') {
        timeLeft = 5;
        timerDisplay.innerText = `Time: ${timeLeft}s`;
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = `Time: ${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timeOutPenalty();
            }
        }, 1000);
    }
}

function timeOutPenalty() {
    p2Score++;
    document.getElementById('p1-side').classList.add('wrong-flash');
    setTimeout(() => document.getElementById('p1-side').classList.remove('wrong-flash'), 500);
    
    updateScores();
    updateRope();
    
    gameState = 'PAUSED';
    setTimeout(() => {
        gameState = 'PLAYING';
        generateQuestion();
    }, 800);
}

function handleInput(player, val) {
    let currentInput = player === '1' ? p1Input : p2Input;
    
    if (val === 'clear') {
        currentInput = "";
    } else if (val === 'enter') {
        if (currentInput !== "") {
            checkAnswer(player, parseInt(currentInput));
            currentInput = ""; // Auto clear after submit
        }
    } else {
        if (currentInput.length < 4) { // Max 4 digits
            currentInput += val;
        }
    }

    if (player === '1') {
        p1Input = currentInput;
    } else {
        p2Input = currentInput;
    }
    updateDisplays();
}

function checkAnswer(player, answer) {
    const isCorrect = answer === expectedAnswer;
    const side = document.getElementById(`p${player}-side`);

    if (isCorrect) {
        if (timerInterval) clearInterval(timerInterval);

        // Correct
        if (player === '1') p1Score++;
        else p2Score++;
        
        side.classList.add('correct-flash');
        setTimeout(() => side.classList.remove('correct-flash'), 500);
        
        updateScores();
        updateRope();
        
        // Short delay before next question
        gameState = 'PAUSED';
        setTimeout(() => {
            gameState = 'PLAYING';
            generateQuestion();
        }, 800);
    } else {
        // Wrong
        side.classList.add('wrong-flash');
        setTimeout(() => side.classList.remove('wrong-flash'), 500);
        
        // Small penalty: rope moves slightly towards opponent, but no score loss.
        // Actually, just clearing their input and flashing red is penalty enough.
        document.getElementById(`p${player}-display`).classList.add('shake');
        setTimeout(() => document.getElementById(`p${player}-display`).classList.remove('shake'), 500);
    }
}

function updateDisplays() {
    p1Display.innerText = p1Input || "_";
    p2Display.innerText = p2Input || "_";
}

function updateScores() {
    p1ScoreEl.innerText = `Score: ${p1Score}`;
    p2ScoreEl.innerText = `Score: ${p2Score}`;
}

function updateRope() {
    // Knot position: 50% is center. 
    // Max score diff is 5. So each point diff moves it 10%.
    const diff = p1Score - p2Score;
    // diff positive -> p1 winning -> moves left (lower %)
    // diff negative -> p2 winning -> moves right (higher %)
    
    let position = 50 - (diff * 10);
    // Clamp between 0 and 100
    position = Math.max(0, Math.min(100, position));
    
    knot.style.left = `${position}%`;
}

function endGame() {
    if (timerInterval) clearInterval(timerInterval);
    gameState = 'ENDED';
    overlay.classList.remove('hidden');
    winnerModal.classList.remove('hidden');
    
    if (p1Score > p2Score) {
        winnerText.innerText = "Player 1 Wins!";
        winnerText.style.color = "var(--p1-color)";
    } else if (p2Score > p1Score) {
        winnerText.innerText = gameMode === 'SINGLE' ? "CPU Wins!" : "Player 2 Wins!";
        winnerText.style.color = "var(--p2-color)";
    } else {
        winnerText.innerText = "It's a Tie!";
        winnerText.style.color = "#fff";
    }

    finalScores.innerHTML = `
        <span class="p1-color">P1: ${p1Score}</span> - 
        <span class="p2-color">P2: ${p2Score}</span>
    `;
}
