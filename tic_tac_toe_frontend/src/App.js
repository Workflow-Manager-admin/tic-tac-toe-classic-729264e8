import React, { useState, useEffect } from "react";
import "./App.css";
import DifficultySelector from "./DifficultySelector";

/**
 * Utility to clone an array.
 */
const cloneBoard = (board) => board.slice();

/**
 * Returns winner info if winning, or null.
 */
function calculateWinner(squares) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6] // diagonals
  ];
  for (let [a,b,c] of lines) {
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return { winner: squares[a], line: [a,b,c] };
    }
  }
  if (squares.every(Boolean)) {
    return { winner: null, line: null, draw: true };
  }
  return null;
}

/**
 * AI Move function - selects move based on difficulty.
 * @param {'easy'|'medium'|'hard'} difficulty
 */
function aiMove(squares, difficulty) {
  const empties = squares
    .map((v, i) => (v ? null : i))
    .filter((v) => v !== null);
  // Helper: select random empty square
  const randomMove = () => {
    if (empties.length === 0) return undefined;
    return empties[Math.floor(Math.random() * empties.length)];
  };

  // Helper: immediate win/block logic (used in medium/hard)
  function findImmediateMove(char) {
    for (let i = 0; i < squares.length; ++i) {
      if (!squares[i]) {
        let copy = cloneBoard(squares);
        copy[i] = char;
        if (calculateWinner(copy)?.winner === char) return i;
      }
    }
    return null;
  }

  if (difficulty === "easy") {
    // Easy: random move
    return randomMove();
  }

  if (difficulty === "medium") {
    // Medium: block win, else random
    // Try to win as O
    const winIdx = findImmediateMove("O");
    if (winIdx !== null) return winIdx;
    // Try to block X
    const blockIdx = findImmediateMove("X");
    if (blockIdx !== null) return blockIdx;
    return randomMove();
  }

  // Hard (minimax): perfect play
  // Falls back to "classic" hard tic tac toe strategy (as before)
  // Try to win
  const winIdx = findImmediateMove("O");
  if (winIdx !== null) return winIdx;
  // Block X
  const blockIdx = findImmediateMove("X");
  if (blockIdx !== null) return blockIdx;
  // Take center
  if (!squares[4]) return 4;
  // Pick random corner
  const corners = [0, 2, 6, 8].filter((idx) => !squares[idx]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // Pick any
  return randomMove();
}

/**
 * Square component - animated.
 */
// PUBLIC_INTERFACE
function Square({ value, onClick, highlight, animate }) {
  return (
    <button
      className={`ttt-square${highlight?' highlight':''}${animate?' animate':''}`}
      onClick={onClick}
      aria-label={value ? `Square ${value}` : "Empty square"}
      tabIndex={0}
    >
      {value}
    </button>
  );
}

/**
 * Board rendering, winLine highlights winning squares.
 */
// PUBLIC_INTERFACE
function Board({ squares, onSquareClick, winLine, lastMove, disable }) {
  return (
    <div className="ttt-board">
      {squares.map((sq, i) => (
        <Square
          key={i}
          value={sq}
          onClick={() => !disable && onSquareClick(i)}
          highlight={winLine && winLine.includes(i)}
          animate={lastMove===i}
        />
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function PlayerModeToggle({ mode, setMode, disabled }) {
  return (
    <div className="ttt-mode-toggle">
      <button
        className={`ttt-mode-btn${mode==="human"?" selected":""}`}
        onClick={()=>!disabled&&setMode("human")}
        disabled={disabled}
        aria-pressed={mode==="human"}
      >
        2 Players
      </button>
      <button
        className={`ttt-mode-btn${mode==="ai"?" selected":""}`}
        onClick={()=>!disabled&&setMode("ai")}
        disabled={disabled}
        aria-pressed={mode==="ai"}
      >
        VS Computer
      </button>
    </div>
  );
}

/**
 * Main game controller and layout
 */
// PUBLIC_INTERFACE
function App() {
  // State hooks
  const [theme, setTheme] = useState('light');
  const [mode, setMode] = useState('human'); // "human" | "ai"
  const [difficulty, setDifficulty] = useState('medium'); // "easy" | "medium" | "hard"
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [status, setStatus] = useState("");
  const [winningLine, setWinningLine] = useState(null);
  const [isGameOver, setGameOver] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [animReset, setAnimReset] = useState(false);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Win/draw detection and status updates
  useEffect(() => {
    const result = calculateWinner(squares);
    if (result?.winner) {
      setStatus(`Winner: ${result.winner === "X" ? "Player 1 (X)" : (mode==="human"?"Player 2 (O)":"Computer (O)")}`);
      setWinningLine(result.line);
      setGameOver(true);
    } else if (result?.draw) {
      setStatus(`Draw!`);
      setGameOver(true);
      setWinningLine(null);
    } else {
      setStatus(`${xIsNext ? "Player 1 (X)" : (mode==="ai"?"Computer (O)":"Player 2 (O)")} turn`);
      setWinningLine(null);
      setGameOver(false);
    }
  }, [squares, xIsNext, mode]);

  // AI move effect
  useEffect(() => {
    if (mode === "ai" && !isGameOver && !xIsNext) {
      const moveTimeout = setTimeout(() => {
        const idx = aiMove(squares, difficulty);
        if (idx !== undefined && squares[idx] === null) {
          handleSquareClick(idx, true);
        }
      }, 500);
      return () => clearTimeout(moveTimeout);
    }
    // eslint-disable-next-line
  }, [xIsNext, mode, isGameOver, squares, difficulty]);

  // PUBLIC_INTERFACE
  function handleSquareClick(i, isAIAgentMove = false) {
    if (isGameOver || squares[i]) return;
    if (mode==="ai" && !xIsNext && !isAIAgentMove) return;
    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? "X" : "O";
    setSquares(nextSquares);
    setXIsNext(!xIsNext);
    setLastMove(i);
  }

  // PUBLIC_INTERFACE
  function handleRestart() {
    setGameOver(false);
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setWinningLine(null);
    setLastMove(null);
    setAnimReset(true);
    setTimeout(()=>setAnimReset(false),10);
  }

  // PUBLIC_INTERFACE
  function handleThemeToggle() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  // PUBLIC_INTERFACE
  function handleModeSwitch(newMode) {
    if (mode !== newMode) {
      setMode(newMode);
      handleRestart();
    }
  }

  // PUBLIC_INTERFACE
  function handleDifficultyChange(newDifficulty) {
    if (difficulty !== newDifficulty) {
      setDifficulty(newDifficulty);
      handleRestart();
    }
  }

  return (
    <div className={`App${theme==="dark"?' dark-mode':''}`}>
      <header className="game-header">
        <h1 className="ttt-title">
          Tic Tac Toe
        </h1>
        <button
          className="theme-toggle"
          onClick={handleThemeToggle}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>
      <main className="ttt-container">
        <div className="ttt-status">{status}</div>
        <Board
          squares={squares}
          onSquareClick={handleSquareClick}
          winLine={winningLine}
          lastMove={animReset ? null : lastMove}
          disable={mode==="ai" && !xIsNext && !isGameOver}
        />
        <div className="ttt-controls">
          <PlayerModeToggle
            mode={mode}
            setMode={handleModeSwitch}
            disabled={!isGameOver && squares.some(Boolean)}
          />
          <button className="ttt-restart-btn" onClick={handleRestart}>
            Restart
          </button>
        </div>
        {/* Difficulty selector - always visible, disabled unless in AI mode */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <label style={{ fontSize: "0.96rem", marginBottom: "4px", color: "#bbb", letterSpacing: "0.02em" }}>
            Difficulty (AI Only)
          </label>
          <DifficultySelector
            value={difficulty}
            onChange={handleDifficultyChange}
            disabled={mode !== "ai" || (!isGameOver && squares.some(Boolean))}
          />
        </div>
      </main>
      <footer className="ttt-footer">
        <span>
          &copy; {new Date().getFullYear()} | Tic Tac Toe | React Minimal UI
        </span>
      </footer>
    </div>
  );
}

export default App;
