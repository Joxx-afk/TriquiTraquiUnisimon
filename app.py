import time
import random
import math
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

def check_winner(board, player):
    win_conditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], # rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], # cols
        [0, 4, 8], [2, 4, 6]             # diagonals
    ]
    for condition in win_conditions:
        if board[condition[0]] == player and board[condition[1]] == player and board[condition[2]] == player:
            return True
    return False

def get_available_moves(board):
    return [i for i, spot in enumerate(board) if spot == '']

def minimax(board, depth, is_maximizing, ai_player, human_player, trace_log, node_count):
    node_count[0] += 1
    
    if check_winner(board, ai_player):
        return 10 - depth
    if check_winner(board, human_player):
        return depth - 10
    if len(get_available_moves(board)) == 0:
        return 0

    if is_maximizing:
        best_score = -math.inf
        for move in get_available_moves(board):
            board[move] = ai_player
            trace_log.append({"type": "code", "line": 28, "desc": f"Probando movimiento {move} para IA"})
            score = minimax(board, depth + 1, False, ai_player, human_player, trace_log, node_count)
            board[move] = ''
            best_score = max(score, best_score)
        return best_score
    else:
        best_score = math.inf
        for move in get_available_moves(board):
            board[move] = human_player
            trace_log.append({"type": "code", "line": 35, "desc": f"Probando movimiento {move} para Jugador"})
            score = minimax(board, depth + 1, True, ai_player, human_player, trace_log, node_count)
            board[move] = ''
            best_score = min(score, best_score)
        return best_score

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/play', methods=['POST'])
def play():
    data = request.json
    board = data.get('board') # Array of 9 strings: 'X', 'O', or ''
    difficulty = data.get('difficulty', 'hard')
    ai_player = 'O'
    human_player = 'X'
    
    trace = []
    stats = {"nodes": 0, "time_ms": 0}
    start_time = time.time()
    
    trace.append({"type": "log", "message": f"[INFO] Iniciando turno de IA. Nivel: {difficulty.upper()}"})
    trace.append({"type": "code", "line": 1, "desc": "Llamando a función de decisión..."})
    
    available_moves = get_available_moves(board)
    best_move = -1
    
    if not available_moves:
        return jsonify({"move": -1, "trace": trace, "stats": stats})

    if difficulty == 'easy':
        best_move = random.choice(available_moves)
        trace.append({"type": "code", "line": 10, "desc": "Dificultad fácil: Seleccionando movimiento aleatorio."})
        stats["nodes"] = 1
        
    elif difficulty == 'medium':
        # Medium: Block if human is winning, win if possible, otherwise random
        trace.append({"type": "code", "line": 15, "desc": "Evaluando amenazas inmediatas..."})
        for move in available_moves:
            board[move] = ai_player
            if check_winner(board, ai_player):
                best_move = move
                trace.append({"type": "log", "message": "[SUCCESS] ¡Movimiento ganador encontrado!"})
            board[move] = ''
            if best_move != -1: break
            
        if best_move == -1:
            for move in available_moves:
                board[move] = human_player
                if check_winner(board, human_player):
                    best_move = move
                    trace.append({"type": "log", "message": "[WARN] Bloqueando victoria del jugador."})
                board[move] = ''
                if best_move != -1: break
                
        if best_move == -1:
            best_move = random.choice(available_moves)
            trace.append({"type": "log", "message": "[INFO] Ninguna amenaza. Movimiento aleatorio."})
        stats["nodes"] = len(available_moves) * 2
        
    else: # Hard - Minimax
        best_score = -math.inf
        node_count = [0]
        trace.append({"type": "code", "line": 22, "desc": "Iniciando algoritmo Minimax..."})
        
        for move in available_moves:
            board[move] = ai_player
            trace.append({"type": "log", "message": f"[MINIMAX] Explorando rama principal: Jugada en {move}"})
            score = minimax(board, 0, False, ai_player, human_player, trace, node_count)
            board[move] = ''
            
            trace.append({"type": "log", "message": f"[MINIMAX] Puntaje para movimiento {move}: {score}"})
            if score > best_score:
                best_score = score
                best_move = move
                
        trace.append({"type": "code", "line": 40, "desc": f"Mejor movimiento seleccionado: {best_move}"})
        stats["nodes"] = node_count[0]

    end_time = time.time()
    stats["time_ms"] = round((end_time - start_time) * 1000, 2)
    
    # Trim trace if it's too long to avoid freezing the browser on very long minimax runs
    if len(trace) > 100:
        trace = trace[:50] + [{"type": "log", "message": "... (ramas omitidas por brevedad) ..."}] + trace[-50:]

    return jsonify({
        "move": best_move,
        "trace": trace,
        "stats": stats
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
