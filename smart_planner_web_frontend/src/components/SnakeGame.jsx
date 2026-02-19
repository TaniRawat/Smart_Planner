import React, { useState, useEffect, useRef } from "react";

const GRID_SIZE = 15;
const INITIAL_SNAKE = [
  { x: 7, y: 7 },
];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const SPEED = 120; // ms

function getRandomFood(snake) {
  let newFood;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    if (!snake.some((s) => s.x === newFood.x && s.y === newFood.y)) break;
  }
  return newFood;
}

export default function SnakeGame() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState(getRandomFood(INITIAL_SNAKE));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const moveRef = useRef(direction);
  const snakeRef = useRef(snake);

  useEffect(() => {
    moveRef.current = direction;
  }, [direction]);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  useEffect(() => {
    if (gameOver) return;
    const handleKey = (e) => {
      let d = moveRef.current;
      if (e.key === "ArrowUp" && d.y !== 1) setDirection({ x: 0, y: -1 });
      else if (e.key === "ArrowDown" && d.y !== -1) setDirection({ x: 0, y: 1 });
      else if (e.key === "ArrowLeft" && d.x !== 1) setDirection({ x: -1, y: 0 });
      else if (e.key === "ArrowRight" && d.x !== -1) setDirection({ x: 1, y: 0 });
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setSnake((prev) => {
        const newHead = {
          x: (prev[0].x + moveRef.current.x + GRID_SIZE) % GRID_SIZE,
          y: (prev[0].y + moveRef.current.y + GRID_SIZE) % GRID_SIZE,
        };
        // Check collision
        if (prev.some((s) => s.x === newHead.x && s.y === newHead.y)) {
          setGameOver(true);
          return prev;
        }
        let newSnake = [newHead, ...prev];
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => s + 1);
          setFood(getRandomFood(newSnake));
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, SPEED);
    return () => clearInterval(interval);
  }, [food, gameOver]);

  function handleRestart() {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(getRandomFood(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-2 text-lg font-bold text-green-400">Snake Game</div>
      <div className="mb-2 text-slate-300">Score: {score}</div>
      <div
        className="grid bg-slate-800 rounded-lg"
        style={{
          gridTemplateRows: `repeat(${GRID_SIZE}, 1.2rem)`,
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1.2rem)`,
          border: "2px solid #22d3ee",
        }}
      >
        {[...Array(GRID_SIZE * GRID_SIZE)].map((_, idx) => {
          const x = idx % GRID_SIZE;
          const y = Math.floor(idx / GRID_SIZE);
          const isSnake = snake.some((s) => s.x === x && s.y === y);
          const isHead = snake[0].x === x && snake[0].y === y;
          const isFood = food.x === x && food.y === y;
          return (
            <div
              key={idx}
              className={`w-5 h-5 sm:w-6 sm:h-6 border border-slate-900 flex items-center justify-center ${
                isHead
                  ? "bg-green-400"
                  : isSnake
                  ? "bg-green-700"
                  : isFood
                  ? "bg-red-500"
                  : "bg-slate-900"
              }`}
              style={{ borderRadius: isHead ? "30%" : isFood ? "50%" : "8%" }}
            ></div>
          );
        })}
      </div>
      {gameOver && (
        <div className="mt-3 text-center">
          <div className="text-rose-400 font-bold mb-2">Game Over!</div>
          <button
            onClick={handleRestart}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all"
          >
            Restart
          </button>
        </div>
      )}
      <div className="mt-2 text-xs text-slate-400">Use arrow keys to move</div>
    </div>
  );
}
