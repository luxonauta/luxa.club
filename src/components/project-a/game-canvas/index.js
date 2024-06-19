import React, { useEffect, useRef, useState } from "react";
import useSound from "use-sound";

/**
 * Draw entities on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {Array} entities - Array of entity objects.
 * @param {string} color - Color to fill the entities.
 * @param {number} [radius=0] - Radius for rounded corners.
 */
const drawEntities = (ctx, entities, color, radius = 0) => {
  ctx.fillStyle = color;
  for (const entity of entities) {
    ctx.beginPath();
    ctx.roundRect(entity.x, entity.y, entity.width, entity.height, radius);
    ctx.fill();
  }
};

/**
 * Update the positions of entities.
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

const impactSoundUrl = "/sounds/impact.mp3";
const coinSoundUrl = "/sounds/coin.mp3";

const coinFrequency = 200;
const enemyFrequency = 300;
const obstacleFrequency = 125;

/**
 * GameCanvas component.
 * @returns {JSX.Element} The rendered game canvas component.
 */
const GameCanvas = () => {
  const canvasRef = useRef(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [distance, setDistance] = useState(0);

  const player = useRef({
    x: 100,
    y: 0,
    width: 25.5,
    height: 25.5,
    dy: 0,
    gravity: 0.5,
    lift: -10
  }).current;

  let frameCount = useRef(0).current;

  const coins = useRef([]).current;
  const enemies = useRef([]).current;
  const keys = useRef({}).current;
  const obstacles = useRef([]).current;

  const [playImpact] = useSound(impactSoundUrl, { interrupt: true });
  const [playCoin] = useSound(coinSoundUrl, { interrupt: true });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      const scale = window.devicePixelRatio;
      canvas.width = Math.floor(canvas.parentElement.clientWidth * scale);
      canvas.height = Math.floor(canvas.width / 2);
      canvas.style.width = `${canvas.width / scale}px`;
      canvas.style.height = `${canvas.height / scale}px`;
      player.y = canvas.height / 2 / scale;
    };

    resizeCanvas();

    const handleKeyDown = (e) => {
      keys[e.code] = true;
    };

    const handleKeyUp = (e) => {
      keys[e.code] = false;
    };

    const handleTouchStart = (e) => {
      keys.Space = true;
      e.preventDefault();
    };

    const handleTouchEnd = (e) => {
      keys.Space = false;
      e.preventDefault();
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);

    gameLoop(ctx, canvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [keys, player]);

  /**
   * Check for collisions between player and other entities.
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

        setIsGameOver(true);
        setCoinsCollected(0);
        setDistance(0);
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

        setIsGameOver(true);
        setCoinsCollected(0);
        setDistance(0);
      }
    }
  };

  /**
   * Create a new coin entity.
   */
  const createCoin = () => {
    coins.push({
      x: canvasRef.current.width,
      y: Math.random() * (canvasRef.current.height - 50),
      width: 20.5,
      height: 20.5
    });
  };

  /**
   * Create a new enemy entity.
   */
  const createEnemy = () => {
    enemies.push({
      x: canvasRef.current.width,
      y: Math.random() * canvasRef.current.height,
      width: 30.5,
      height: 30.5,
      speed: Math.random() * 2 + 1
    });
  };

  /**
   * Create a new obstacle entity.
   */
  const createObstacle = () => {
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
   * Update the player's position and state.
   */
  const updatePlayer = () => {
    if (keys.Space) {
      player.dy = player.lift;
    }

    player.dy += player.gravity;
    player.y += player.dy;

    if (player.y + player.height > canvasRef.current.height) {
      player.y = canvasRef.current.height - player.height;
      player.dy = 0;
    } else if (player.y < 0) {
      player.y = 0;
      player.dy = 0;
    }
  };

  /**
   * Draw the player on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  const drawPlayer = (ctx) => {
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 6);
    ctx.fill();
  };

  /**
   * Main game loop.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {HTMLCanvasElement} canvas - The canvas element.
   */
  const gameLoop = (ctx, canvas) => {
    if (!isGameOver) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      updateEntities(coins);
      updateEntities(enemies, 3);
      updateEntities(obstacles);
      updatePlayer(player, keys, canvasRef);

      drawEntities(ctx, coins, "#eab308", 10);
      drawEntities(ctx, enemies, "#ef4444", 6);
      drawEntities(ctx, obstacles, "#f97316", 6);
      drawPlayer(ctx, player);

      checkCollisions();

      frameCount++;
      setDistance((frameCount / 60 / 1000).toFixed(2));

      if (frameCount % coinFrequency === 0) createCoin();
      if (frameCount % enemyFrequency === 0) createEnemy();
      if (frameCount % obstacleFrequency === 0) createObstacle();

      requestAnimationFrame(() => gameLoop(ctx, canvas));
    }
  };

  /**
   * Restart the game.
   */
  const restartGame = () => {
    setIsGameOver(false);

    setCoinsCollected(0);
    setDistance(0);

    coins.length = 0;
    enemies.length = 0;
    frameCount = 0;
    obstacles.length = 0;
    player.dy = 0;
    player.y = canvasRef.current.height / 2;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    gameLoop(ctx, canvas);
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
      </div>
      <p>
        Press the spacebar to jump and avoid obstacles. Collect coins to
        increase your score.
      </p>
      <div>
        <p>Distance: {distance} km</p>
        <p>Coins Collected: {coinsCollected}</p>
      </div>
    </>
  );
};

export default GameCanvas;
