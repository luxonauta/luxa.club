import React, { useEffect, useRef, useState } from "react";
import useSound from "use-sound";

/**
 * Draws entities on the canvas.
 * @param {CanvasRenderingContext2D} context - The canvas rendering context.
 * @param {Array} entities - Array of entity objects.
 * @param {string} color - Color to fill the entities.
 * @param {number} [cornerRadius=0] - Radius for rounded corners.
 */
const drawEntities = (context, entities, color, cornerRadius = 0) => {
  context.fillStyle = color;
  entities.forEach((entity) => {
    context.beginPath();
    context.roundRect(
      entity.x,
      entity.y,
      entity.width,
      entity.height,
      cornerRadius
    );
    context.fill();
  });
};

/**
 * Updates the positions of entities.
 * @param {Array} entities - Array of entity objects.
 * @param {number} [speed=5] - Speed at which entities move.
 */
const updateEntities = (entities, speed = 5) => {
  for (let i = entities.length - 1; i >= 0; i--) {
    entities[i].x -= speed;
    if (entities[i].x + entities[i].width < 0) {
      entities.splice(i, 1);
    }
  }
};

const IMPACT_SOUND_URL = "/sounds/impact.mp3";
const COIN_SOUND_URL = "/sounds/coin.mp3";
const BEEP_SOUND_URL = "/sounds/beep.mp3";

const COIN_SPAWN_RATE = 200;
const ENEMY_SPAWN_RATE = 300;
const OBSTACLE_SPAWN_RATE = 100;

const GameCanvas = () => {
  const canvasRef = useRef(null);

  const [isGameOver, setIsGameOver] = useState(false);
  const isGameOverRef = useRef(isGameOver);

  const [coinsCollected, setCoinsCollected] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(3);

  const [countdown, setCountdown] = useState(3);
  const [isCountdownActive, setIsCountdownActive] = useState(true);

  const player = useRef({
    x: 100,
    y: 0,
    width: 25.5,
    height: 25.5,
    dy: 0,
    gravity: 0.5,
    lift: -5
  }).current;

  let frameCount = useRef(0).current;

  const coins = useRef([]).current;
  const enemies = useRef([]).current;
  const keysPressed = useRef({}).current;
  const obstacles = useRef([]).current;

  const [playImpact] = useSound(IMPACT_SOUND_URL, { volume: 1.0 });
  const [playCoin] = useSound(COIN_SOUND_URL, { volume: 1.0 });
  const [playBeep] = useSound(BEEP_SOUND_URL, { volume: 1.0 });

  useEffect(() => {
    isGameOverRef.current = isGameOver;
  }, [isGameOver]);

  useEffect(() => {
    if (!isCountdownActive) return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (typeof prev === "number") {
          if (prev > 1) {
            playBeep();
            return prev - 1;
          }

          if (prev === 1) {
            playBeep();
            return "GO!";
          }
        } else if (prev === "GO!") {
          clearInterval(countdownInterval);
          setTimeout(startGame, 500);

          return prev;
        }

        return prev;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isCountdownActive, playBeep]);

  useEffect(() => {
    const canvas = canvasRef.current;

    const resizeCanvas = () => {
      const scale = window.devicePixelRatio;
      canvas.width = Math.floor(canvas.parentElement.clientWidth * scale);
      canvas.height = Math.floor(canvas.width / 2);
      canvas.style.width = `${canvas.width / scale}px`;
      canvas.style.height = `${canvas.height / scale}px`;
      player.y = canvas.height / 2 / scale;
    };

    resizeCanvas();

    const handleKeyDown = (event) => {
      keysPressed[event.code] = true;
    };

    const handleKeyUp = (event) => {
      keysPressed[event.code] = false;
    };

    const handleTouchStart = (event) => {
      keysPressed.Space = true;
      event.preventDefault();
    };

    const handleTouchEnd = (event) => {
      keysPressed.Space = false;
      event.preventDefault();
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [keysPressed, player]);

  const startGame = () => {
    setCountdown(null);
    setIsCountdownActive(false);

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Initial boost for the player
    player.dy = player.lift;

    startGameLoop(context, canvas);
  };

  /**
   * Checks for collisions between player and other entities.
   */
  const checkCollisions = () => {
    for (const obstacle of obstacles) {
      if (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y
      ) {
        playImpact();
        resetGame();
        return;
      }
    }

    for (let i = coins.length - 1; i >= 0; i--) {
      if (
        player.x < coins[i].x + coins[i].width &&
        player.x + player.width > coins[i].x &&
        player.y < coins[i].y + coins[i].height &&
        player.y + player.height > coins[i].y
      ) {
        playCoin();
        coins.splice(i, 1);
        setCoinsCollected((prev) => prev + 1);
        setGameSpeed((prev) => Math.max(prev - 1, 1));
      }
    }

    for (const enemy of enemies) {
      if (
        player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y
      ) {
        playImpact();
        resetGame();
        return;
      }
    }
  };

  /**
   * Resets the game state.
   */
  const resetGame = () => {
    setCoinsCollected(0);
    setDistance(0);
    setGameSpeed(5);
    setIsGameOver(true);
  };

  /**
   * Creates a new coin entity.
   */
  const spawnCoin = () => {
    coins.push({
      x: canvasRef.current.width,
      y: Math.random() * (canvasRef.current.height - 50),
      width: 20.5,
      height: 20.5
    });
  };

  /**
   * Creates a new enemy entity.
   */
  const spawnEnemy = () => {
    enemies.push({
      x: canvasRef.current.width,
      y: Math.random() * canvasRef.current.height,
      width: 30.5,
      height: 30.5,
      speed: Math.random() * 2 + 1
    });
  };

  /**
   * Creates a new obstacle entity.
   */
  const spawnObstacle = () => {
    const height = Math.random() * (canvasRef.current.height - 200) + 50;
    const isTop = Math.random() < 0.5;
    obstacles.push({
      x: canvasRef.current.width,
      y: isTop ? 0 : canvasRef.current.height - height,
      width: 30.5,
      height: height
    });
  };

  /**
   * Updates the player's position and state.
   */
  const updatePlayer = () => {
    if (keysPressed.Space) {
      player.dy = player.lift;
    }

    player.dy += player.gravity;
    player.y += player.dy;

    if (player.y + player.height > canvasRef.current.height || player.y < 0) {
      playImpact();
      resetGame();
    }
  };

  /**
   * Draws the player on the canvas.
   * @param {CanvasRenderingContext2D} context - The canvas rendering context.
   */
  const drawPlayer = (context) => {
    context.fillStyle = "#334155";
    context.beginPath();
    context.roundRect(player.x, player.y, player.width, player.height, 6);
    context.fill();
  };

  /**
   * Main game loop.
   * @param {CanvasRenderingContext2D} context - The canvas rendering context.
   * @param {HTMLCanvasElement} canvas - The canvas element.
   */
  const startGameLoop = (context, canvas) => {
    if (isGameOverRef.current) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    updateEntities(coins, gameSpeed);
    updateEntities(enemies, gameSpeed + 2);
    updateEntities(obstacles, gameSpeed);
    updatePlayer();

    drawEntities(context, coins, "#eab308", 10);
    drawEntities(context, enemies, "#ef4444", 6);
    drawEntities(context, obstacles, "#f97316", 6);
    drawPlayer(context);

    checkCollisions();

    frameCount++;
    setDistance((frameCount / 60 / 1000).toFixed(2));

    if (frameCount % COIN_SPAWN_RATE === 0) spawnCoin();
    if (frameCount % ENEMY_SPAWN_RATE === 0) spawnEnemy();
    if (frameCount % OBSTACLE_SPAWN_RATE === 0) spawnObstacle();

    setGameSpeed((prev) => prev + 0.02);

    requestAnimationFrame(() => startGameLoop(context, canvas));
  };

  /**
   * Restarts the game.
   */
  const restartGame = () => {
    setIsGameOver(false);
    isGameOverRef.current = false;

    setCoinsCollected(0);
    setDistance(0);
    setGameSpeed(5);

    coins.length = 0;
    enemies.length = 0;
    frameCount = 0;
    obstacles.length = 0;
    player.dy = 0;
    player.y = canvasRef.current.height / 2;

    setCountdown(3);
    setIsCountdownActive(true);
  };

  return (
    <>
      <div className="game-container">
        <canvas ref={canvasRef} />
        {isGameOver && (
          <div className="game-over row flow-column-wrap">
            <button
              type="button"
              onClick={restartGame}
              className="action primary"
            >
              Restart
            </button>
          </div>
        )}
        {isCountdownActive && (
          <div className="countdown row flow-column-wrap">
            <span>{countdown}</span>
          </div>
        )}
      </div>
      <p>
        Press the spacebar or tap the screen to jump and avoid obstacles.
        Collect coins to increase your score and slow down the increasing speed.
        The game will end if you hit an obstacle or enemy or fall off the
        screen.
      </p>
      <div>
        <p>Distance: {distance} km</p>
        <p>Coins Collected: {coinsCollected}</p>
      </div>
    </>
  );
};

export default GameCanvas;
