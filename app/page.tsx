"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Coordinate = {
  x: number;
  y: number;
};

type Direction = "up" | "down" | "left" | "right";

type GamePhase = "ready" | "running" | "paused" | "gameover";

const BOARD_SIZE = 20;
const CELL_SIZE = 24;
const SPEED_LEVELS = [220, 180, 150, 120, 90, 70];

const randomCoordinate = (): Coordinate => ({
  x: Math.floor(Math.random() * BOARD_SIZE),
  y: Math.floor(Math.random() * BOARD_SIZE)
});

const getInitialSnake = (): Coordinate[] => [
  { x: 8, y: 10 },
  { x: 7, y: 10 },
  { x: 6, y: 10 }
];

const isOpposite = (a: Direction, b: Direction) =>
  (a === "up" && b === "down") ||
  (a === "down" && b === "up") ||
  (a === "left" && b === "right") ||
  (a === "right" && b === "left");

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snake, setSnake] = useState<Coordinate[]>(() => getInitialSnake());
  const [direction, setDirection] = useState<Direction>("right");
  const [queuedDirection, setQueuedDirection] = useState<Direction | null>(null);
  const [food, setFood] = useState<Coordinate>(() => randomCoordinate());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speedLevel, setSpeedLevel] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("ready");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("snake-highscore") : null;
    if (!stored) return;
    const parsed = Number(stored);
    if (!Number.isNaN(parsed)) {
      setHighScore(parsed);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("snake-highscore", String(highScore));
  }, [highScore]);

  const speed = useMemo(() => SPEED_LEVELS[speedLevel], [speedLevel]);

  const resetGame = useCallback(() => {
    const newSnake = getInitialSnake();
    setSnake(newSnake);
    setDirection("right");
    setQueuedDirection(null);
    setFood(randomCoordinate());
    setScore(0);
    setSpeedLevel(0);
    setPhase("ready");
  }, []);

  const placeFood = useCallback(
    (currentSnake: Coordinate[]) => {
      let nextFood = randomCoordinate();
      while (currentSnake.some((segment) => segment.x === nextFood.x && segment.y === nextFood.y)) {
        nextFood = randomCoordinate();
      }
      setFood(nextFood);
    },
    []
  );

  const advanceGame = useCallback(() => {
    setSnake((prevSnake) => {
      const nextDirection = queuedDirection && !isOpposite(queuedDirection, direction)
        ? queuedDirection
        : direction;

      const head = prevSnake[0];
      const nextHead = {
        x: (head.x + (nextDirection === "right" ? 1 : nextDirection === "left" ? -1 : 0) + BOARD_SIZE) % BOARD_SIZE,
        y: (head.y + (nextDirection === "down" ? 1 : nextDirection === "up" ? -1 : 0) + BOARD_SIZE) % BOARD_SIZE
      };

      const hitsBody = prevSnake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);
      if (hitsBody) {
        setPhase("gameover");
        setHighScore((previousHigh) => Math.max(previousHigh, score));
        return prevSnake;
      }

      const hasEaten = nextHead.x === food.x && nextHead.y === food.y;
      const nextSnake = [nextHead, ...prevSnake];

      if (!hasEaten) {
        nextSnake.pop();
      } else {
        setScore((prev) => {
          const nextScore = prev + 10;
          setHighScore((previousHigh) => Math.max(previousHigh, nextScore));
          return nextScore;
        });
        setSpeedLevel((prev) => Math.min(SPEED_LEVELS.length - 1, prev + (prevSnake.length % 4 === 0 ? 1 : 0)));
        placeFood(nextSnake);
      }

      setDirection(nextDirection);
      setQueuedDirection(null);
      return nextSnake;
    });
  }, [direction, food.x, food.y, placeFood, queuedDirection, score]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, currentSnake: Coordinate[], currentFood: Coordinate) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
      for (let x = 0; x <= BOARD_SIZE; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, BOARD_SIZE * CELL_SIZE);
        ctx.stroke();
      }
      for (let y = 0; y <= BOARD_SIZE; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(BOARD_SIZE * CELL_SIZE, y * CELL_SIZE);
        ctx.stroke();
      }

      currentSnake.forEach((segment, index) => {
        const gradient = ctx.createLinearGradient(
          segment.x * CELL_SIZE,
          segment.y * CELL_SIZE,
          (segment.x + 1) * CELL_SIZE,
          (segment.y + 1) * CELL_SIZE
        );
        gradient.addColorStop(0, index === 0 ? "#22d3ee" : "#38bdf8");
        gradient.addColorStop(1, index === 0 ? "#6366f1" : "#0ea5e9");
        ctx.fillStyle = gradient;
        ctx.fillRect(segment.x * CELL_SIZE + 2, segment.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      });

      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(
        currentFood.x * CELL_SIZE + CELL_SIZE / 2,
        currentFood.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    },
    []
  );

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    draw(ctx, snake, food);
  }, [draw, snake, food]);

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const interval = window.setInterval(() => {
      advanceGame();
    }, speed);

    return () => window.clearInterval(interval);
  }, [advanceGame, speed, phase]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const mapping: Record<string, Direction> = {
        arrowup: "up",
        w: "up",
        arrowdown: "down",
        s: "down",
        arrowleft: "left",
        a: "left",
        arrowright: "right",
        d: "right"
      };

      const next = mapping[key];
      if (!next) return;

      event.preventDefault();
      setQueuedDirection((prev) => {
        if (!prev) {
          return next;
        }
        if (isOpposite(prev, next)) {
          return prev;
        }
        return next;
      });

      if (phase === "ready" || phase === "gameover") {
        setPhase("running");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase]);

  const handleStart = () => {
    if (phase === "running") return;
    if (phase === "gameover") {
      resetGame();
      setPhase("running");
      return;
    }
    setPhase("running");
  };

  const handlePauseToggle = () => {
    setPhase((prev) => (prev === "running" ? "paused" : "running"));
  };

  const statusMessage = useMemo(() => {
    switch (phase) {
      case "ready":
        return "Press start or use arrow keys to begin";
      case "paused":
        return "Paused";
      case "gameover":
        return "Game over! Tap restart to play again";
      default:
        return null;
    }
  }, [phase]);

  const controlDirection = (next: Direction) => {
    setQueuedDirection((prev) => {
      if (!prev) return next;
      if (isOpposite(prev, next)) return prev;
      return next;
    });
    if (phase === "ready" || phase === "gameover") {
      setPhase("running");
    }
  };

  return (
    <main>
      <h1>Neon Snake</h1>
      <p>Classic arcade snake built with Next.js. Collect glowing orbs, avoid your tail, and climb the leaderboard!</p>
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={BOARD_SIZE * CELL_SIZE}
          height={BOARD_SIZE * CELL_SIZE}
          aria-label="Snake game board"
          role="img"
        />
        {statusMessage && phase !== "running" && (
          <div className="status-banner">
            <strong>{statusMessage}</strong>
            {phase === "gameover" && <span>Your score: {score}</span>}
            <div className="controls">
              <button onClick={handleStart}>{phase === "gameover" ? "Restart" : "Start"}</button>
              {phase === "paused" ? (
                <button onClick={handlePauseToggle}>Resume</button>
              ) : (
                <button onClick={() => setPhase("paused")}>Pause</button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="scoreboard">
        <div>Score: {score}</div>
        <div>Best: {highScore}</div>
        <div>Level: {speedLevel + 1}</div>
      </div>
      <div className="controls" aria-label="Directional controls">
        <div className="control-grid">
          <div />
          <button onClick={() => controlDirection("up")} aria-label="Move up">
            ⬆
          </button>
          <div />
          <button onClick={() => controlDirection("left")} aria-label="Move left">
            ⬅
          </button>
          <button onClick={handlePauseToggle} aria-label="Pause or resume">
            {phase === "running" ? "⏸" : "▶"}
          </button>
          <button onClick={() => controlDirection("right")} aria-label="Move right">
            ➡
          </button>
          <div />
          <button onClick={() => controlDirection("down")} aria-label="Move down">
            ⬇
          </button>
          <div />
        </div>
        {phase === "gameover" ? (
          <button onClick={resetGame}>Reset</button>
        ) : (
          <button onClick={handleStart}>{phase === "running" ? "Restart" : "Start"}</button>
        )}
      </div>
    </main>
  );
}
