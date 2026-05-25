// Inicializar partículas
particlesJS("particles-js", {
    "particles": {
        "number": { "value": 50, "density": { "enable": true, "value_area": 800 } },
        "color": { "value": "#00ff88" },
        "shape": { "type": "circle" },
        "opacity": { "value": 0.2, "random": false },
        "size": { "value": 3, "random": true },
        "line_linked": { "enable": true, "distance": 150, "color": "#00ff88", "opacity": 0.1, "width": 1 },
        "move": { "enable": true, "speed": 1, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
        "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 0.5 } }, "push": { "particles_nb": 4 } }
    },
    "retina_detect": true
});

// Audio Synth para sonidos tech
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'lose') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'ai_think') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    }
}

// Variables del juego
let board = ['', '', '', '', '', '', '', '', ''];
let isGameActive = true;
let isAILocking = false;
let scores = { player: 0, ai: 0, ties: 0 };
let tournamentsWon = parseInt(localStorage.getItem('tournamentsWon')) || 0;

// Elementos del DOM
const cells = document.querySelectorAll('.cell');
const banner = document.getElementById('message-banner');
const terminalBody = document.getElementById('terminal-body');
const statNodes = document.getElementById('stat-nodes');
const statTime = document.getElementById('stat-time');
const statAlgo = document.getElementById('stat-algo');
const diffSelect = document.getElementById('difficulty');
const tournamentDisplay = document.getElementById('tournaments-won');

tournamentDisplay.textContent = tournamentsWon;

const WIN_CONDITIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// Event Listeners
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
document.getElementById('btn-restart').addEventListener('click', restartGame);
diffSelect.addEventListener('change', () => {
    statAlgo.textContent = diffSelect.value === 'hard' ? 'Minimax' : (diffSelect.value === 'medium' ? 'Heurística' : 'Aleatorio');
    restartGame();
});

function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'));

    if (board[index] !== '' || !isGameActive || isAILocking) return;

    // Jugada del jugador
    makeMove(index, 'X');
    playSound('click');

    if (checkResult()) return;

    // Turno IA
    isAILocking = true;
    banner.innerHTML = `<p class="thinking">La IA está pensando... Analizando probabilidades.</p>`;
    requestAIMove();
}

function makeMove(index, player) {
    board[index] = player;
    cells[index].textContent = player;
    cells[index].classList.add(player.toLowerCase());
}

function checkResult() {
    let roundWon = false;
    let winningLine = [];

    for (let i = 0; i < WIN_CONDITIONS.length; i++) {
        const [a, b, c] = WIN_CONDITIONS[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            winningLine = [a, b, c];
            break;
        }
    }

    if (roundWon) {
        isGameActive = false;
        winningLine.forEach(index => cells[index].classList.add('win'));
        const winner = board[winningLine[0]];
        
        if (winner === 'X') {
            banner.innerHTML = `<p style="color: var(--neon-green)">¡Has vencido a la máquina! Eres un prodigio.</p>`;
            scores.player++;
            document.getElementById('score-player').textContent = scores.player;
            playSound('win');
            checkAchievements();
        } else {
            banner.innerHTML = `<p style="color: var(--accent-blue)">La IA ha ganado. Así funciona la lógica perfecta.</p>`;
            scores.ai++;
            document.getElementById('score-ai').textContent = scores.ai;
            playSound('lose');
        }
        return true;
    }

    if (!board.includes('')) {
        isGameActive = false;
        banner.innerHTML = `<p>Empate lógico. Ambos jugaron óptimamente.</p>`;
        scores.ties++;
        document.getElementById('score-ties').textContent = scores.ties;
        return true;
    }

    return false;
}

async function requestAIMove() {
    try {
        const response = await fetch('/api/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                board: board,
                difficulty: diffSelect.value
            })
        });
        
        const data = await response.json();
        
        if (data.move !== -1) {
            // Animar el proceso de pensamiento de la IA
            await animateAIThoughtProcess(data.trace, data.stats);
            
            makeMove(data.move, 'O');
            playSound('click');
            
            if (!checkResult()) {
                banner.innerHTML = `<p>Turno del jugador. Analiza tu siguiente movimiento.</p>`;
                isAILocking = false;
            }
        }
    } catch (error) {
        console.error("Error comunicando con el backend", error);
        banner.innerHTML = `<p style="color: red">Error de conexión con el núcleo lógico.</p>`;
        isAILocking = false;
    }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function animateAIThoughtProcess(trace, stats) {
    statNodes.textContent = "0";
    statTime.textContent = "Calculando...";
    
    // Limpiar terminal
    terminalBody.innerHTML = '';
    
    // Animar nodos progresivamente
    let currentNodes = 0;
    const nodeIncrement = Math.max(1, Math.floor(stats.nodes / (trace.length || 1)));

    for (let i = 0; i < trace.length; i++) {
        const item = trace[i];
        
        // Efecto de sonido corto
        if (i % 3 === 0) playSound('ai_think');
        
        if (item.type === 'log') {
            const p = document.createElement('p');
            let colorClass = 'sys-msg';
            if (item.message.includes('[INFO]')) colorClass = 'log-info';
            if (item.message.includes('[WARN]')) colorClass = 'log-warn';
            if (item.message.includes('[SUCCESS]')) colorClass = 'log-success';
            if (item.message.includes('[MINIMAX]')) colorClass = 'log-minimax';
            
            p.className = colorClass;
            p.textContent = `> ${item.message}`;
            terminalBody.appendChild(p);
            terminalBody.scrollTop = terminalBody.scrollHeight;
        } else if (item.type === 'code') {
            // Resaltar línea de código
            document.querySelectorAll('.line').forEach(l => l.classList.remove('active'));
            const lineEl = document.getElementById(`line-${item.line}`);
            if (lineEl) {
                lineEl.classList.add('active');
                // Auto scroll en el editor
                lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            const p = document.createElement('p');
            p.className = 'sys-msg';
            p.style.opacity = '0.5';
            p.textContent = `  -> ${item.desc}`;
            terminalBody.appendChild(p);
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }
        
        currentNodes = Math.min(stats.nodes, currentNodes + nodeIncrement);
        statNodes.textContent = currentNodes;
        
        // Tiempo de espera dinámico dependiendo de la longitud del log
        const delay = trace.length > 20 ? 30 : 100;
        await sleep(delay);
    }
    
    // Quitar último highlight
    setTimeout(() => {
        document.querySelectorAll('.line').forEach(l => l.classList.remove('active'));
    }, 500);

    statNodes.textContent = stats.nodes;
    statTime.textContent = `${stats.time_ms} ms`;
}

function restartGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    isGameActive = true;
    isAILocking = false;
    
    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });
    
    banner.innerHTML = `<p>Sistema reiniciado. Tu turno.</p>`;
    terminalBody.innerHTML = `<p class="sys-msg">Esperando movimiento...</p>`;
    
    statNodes.textContent = "0";
    statTime.textContent = "0 ms";
}

function showToast(msg) {
    const toast = document.getElementById('achievement-toast');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

function checkAchievements() {
    if (scores.player === 1 && diffSelect.value === 'hard') {
        if (!localStorage.getItem('ach_beat_minimax')) {
            localStorage.setItem('ach_beat_minimax', 'true');
            showToast("¡Venciste a la IA Imposible! (Imposible)");
            // Note: In pure minimax, the human can never win, only tie. If this triggers, something is wrong or the AI bugged out!
        }
    }
    if (scores.player === 3) {
        tournamentsWon++;
        localStorage.setItem('tournamentsWon', tournamentsWon);
        tournamentDisplay.textContent = tournamentsWon;
        scores.player = 0;
        scores.ai = 0;
        scores.ties = 0;
        document.getElementById('score-player').textContent = "0";
        document.getElementById('score-ai').textContent = "0";
        document.getElementById('score-ties').textContent = "0";
        showToast("¡Torneo Ganado! Subes de nivel.");
    }
}
