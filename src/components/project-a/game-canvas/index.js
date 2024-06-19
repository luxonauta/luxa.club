import React, { useEffect, useRef, useState } from "react";

/**
 * Updates the positions of entities, moving them to the left.
 * If an entity moves off the canvas, it is removed from the array.
 *
 * @param {Array<Object>} entities - The array of entities to update.
 * @param {number} [speed=5] - The speed at which to move the entities.
 */
const updateEntities = (entities, speed = 5) => {
  for (let i = entities.length - 1; i >= 0; i--) {
    entities[i].x -= speed;
    if (entities[i].x + entities[i].width < 0) {
      entities.splice(i, 1);
    }
  }
};

/**
 * Draws entities on the canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {Array<Object>} entities - The array of entities to draw.
 * @param {string} color - The color to use for drawing the entities.
 * @param {number} [radius=0] - The corner radius for rounded rectangles.
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
 * The GameCanvas component renders a canvas-based game.
 *
 * @returns {JSX.Element} The rendered GameCanvas component.
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

  const keys = useRef({}).current;
  const obstacles = useRef([]).current;
  const coins = useRef([]).current;
  const enemies = useRef([]).current;
  let frameCount = useRef(0).current;

  const obstacleFrequency = 125;
  const coinFrequency = 200;
  const enemyFrequency = 300;

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
   * Creates a new obstacle and adds it to the obstacles array.
   */
  const createObstacle = () => {
    const height = Math.random() * (canvasRef.current.height - 200) + 50;
    obstacles.push({
      x: canvasRef.current.width,
      y: canvasRef.current.height - height,
      width: 30.5,
      height: height
    });
  };

  /**
   * Creates a new coin and adds it to the coins array.
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
   * Creates a new enemy and adds it to the enemies array.
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
   * Updates the player's position based on gravity and user input.
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
   * Checks for collisions between the player and other entities.
   */
  const checkCollisions = () => {
    for (const obstacle of obstacles) {
      if (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y
      ) {
        setIsGameOver(true);
      }
    }

    for (let i = coins.length - 1; i >= 0; i--) {
      if (
        player.x < coins[i].x + coins[i].width &&
        player.x + player.width > coins[i].x &&
        player.y < coins[i].y + coins[i].height &&
        player.y + player.height > coins[i].y
      ) {
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
        setIsGameOver(true);
      }
    }
  };

  /**
   * Draws the player on the canvas context.
   *
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  const drawPlayer = (ctx) => {
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 6);
    ctx.fill();
  };

  /**
   * The main game loop, which updates and renders the game state.
   *
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {HTMLCanvasElement} canvas - The canvas element.
   */
  const gameLoop = (ctx, canvas) => {
    if (!isGameOver) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updatePlayer();
      updateEntities(obstacles);
      updateEntities(coins);
      updateEntities(enemies, 3);
      drawEntities(ctx, obstacles, "#f97316", 6);
      drawEntities(ctx, coins, "#eab308", 10);
      drawEntities(ctx, enemies, "#ef4444", 6);
      drawPlayer(ctx);
      checkCollisions();

      frameCount++;
      setDistance((frameCount / 60 / 1000).toFixed(2));

      if (frameCount % obstacleFrequency === 0) createObstacle();
      if (frameCount % coinFrequency === 0) createCoin();
      if (frameCount % enemyFrequency === 0) createEnemy();

      requestAnimationFrame(() => gameLoop(ctx, canvas));
    }
  };

  /**
   * Restarts the game by resetting the game state.
   */
  const restartGame = () => {
    setIsGameOver(false);
    setCoinsCollected(0);
    setDistance(0);
    obstacles.length = 0;
    coins.length = 0;
    enemies.length = 0;
    frameCount = 0;
    player.y = canvasRef.current.height / 2;
    player.dy = 0;

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
            <button type="button" onClick={restartGame} className="action">
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
