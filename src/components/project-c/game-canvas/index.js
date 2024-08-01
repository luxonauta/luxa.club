import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * Draws a rounded rectangle on the canvas.
 * @param {CanvasRenderingContext2D} context - The canvas rendering context.
 * @param {number} x - The x-coordinate of the rectangle.
 * @param {number} y - The y-coordinate of the rectangle.
 * @param {number} width - The width of the rectangle.
 * @param {number} height - The height of the rectangle.
 * @param {number} radius - The radius of the corners.
 */
const drawRoundedRect = (context, x, y, width, height, radius) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fill();
};

/**
 * Draws multiple entities on the canvas.
 * @param {CanvasRenderingContext2D} context - The canvas rendering context.
 * @param {Array} entities - The entities to draw.
 * @param {string} color - The color of the entities.
 * @param {number} cornerRadius - The radius of the corners.
 */
const drawEntities = (context, entities, color, cornerRadius = 0) => {
  context.fillStyle = color;
  entities.forEach((entity) => {
    drawRoundedRect(
      context,
      entity.x,
      entity.y,
      entity.width,
      entity.height,
      cornerRadius
    );
  });
};

/**
 * Main game component.
 * @returns {JSX.Element} The rendered game canvas and UI.
 */
const GameCanvas = () => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef({
    player: {
      x: 0, // Will be set properly in resizeCanvas
      y: 0, // Will be set properly in resizeCanvas
      width: 20.5,
      height: 20.5,
      life: 3,
      stamina: 1,
      dexterity: 1,
      speed: 1,
      rollCooldown: 0,
      invincible: false
    },
    enemies: [],
    projectiles: [],
    score: 0,
    highScore: localStorage.getItem("highScore") || 0,
    enemySpawnTime: 300,
    enemyMaxSpeed: 0.8,
    enemiesDefeated: 0
  });
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [score, setScore] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const frameRef = useRef(0);
  const keysPressed = useRef({});
  const lastUpdateTimeRef = useRef(Date.now());
  const lastRollTimeRef = useRef({});
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  /**
   * Spawns a new enemy at a random position outside the viewport.
   * @returns {Object} The newly spawned enemy.
   */
  const spawnEnemy = () => {
    const canvas = canvasRef.current;
    const scale = window.devicePixelRatio;
    const canvasWidth = canvas.width / scale;
    const canvasHeight = canvas.height / scale;

    const side = Math.floor(Math.random() * 4);
    const positionOptions = [
      { x: Math.random() * canvasWidth, y: -20.5 },
      { x: Math.random() * canvasWidth, y: canvasHeight + 20.5 },
      { x: -20.5, y: Math.random() * canvasHeight },
      { x: canvasWidth + 20.5, y: Math.random() * canvasHeight }
    ];

    const { x, y } = positionOptions[side];

    return {
      x,
      y,
      speed: Math.random() * gameStateRef.current.enemyMaxSpeed + 0.2,
      width: 20.5,
      height: 20.5
    };
  };

  /**
   * Updates the game state.
   */
  const updateGameState = () => {
    const now = Date.now();
    const deltaTime = Math.min((now - lastUpdateTimeRef.current) / 1000, 0.1);
    lastUpdateTimeRef.current = now;

    const { player, enemies, projectiles } = gameStateRef.current;

    // Update enemies
    gameStateRef.current.enemies = enemies.map((enemy) => {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const angle = Math.atan2(dy, dx);
      return {
        ...enemy,
        x: enemy.x + Math.cos(angle) * enemy.speed * deltaTime * 60,
        y: enemy.y + Math.sin(angle) * enemy.speed * deltaTime * 60
      };
    });

    // Update projectiles
    gameStateRef.current.projectiles = projectiles.map((projectile) => ({
      ...projectile,
      x:
        projectile.x +
        Math.cos(projectile.angle) * projectile.speed * deltaTime * 60,
      y:
        projectile.y +
        Math.sin(projectile.angle) * projectile.speed * deltaTime * 60
    }));

    checkCollisions();
    checkBoundaryCollisions();
  };

  /**
   * Checks for collisions between entities.
   */
  const checkCollisions = () => {
    const { player, enemies, projectiles } = gameStateRef.current;

    // Check projectile-enemy collisions
    gameStateRef.current.projectiles = projectiles.filter((projectile) => {
      const hitEnemy = enemies.find((enemy) => {
        const distance = Math.hypot(
          projectile.x - (enemy.x + enemy.width / 2),
          projectile.y - (enemy.y + enemy.height / 2)
        );
        return distance < (enemy.width + enemy.height) / 4;
      });

      if (hitEnemy) {
        gameStateRef.current.enemies = enemies.filter(
          (enemy) => enemy !== hitEnemy
        );
        gameStateRef.current.enemiesDefeated++;
        gameStateRef.current.score += player.dexterity;
        setScore(gameStateRef.current.score);

        if (
          gameStateRef.current.enemiesDefeated % 10 === 0 &&
          gameStateRef.current.enemiesDefeated > 0
        ) {
          setShowUpgrade(true);
          setIsGamePaused(true);
        }

        return false; // Remove the projectile
      }
      return true; // Keep the projectile
    });

    // Check player-enemy collisions
    if (!player.invincible) {
      const hitEnemy = enemies.find((enemy) => {
        const distance = Math.hypot(
          enemy.x + enemy.width / 2 - (player.x + player.width / 2),
          enemy.y + enemy.height / 2 - (player.y + player.height / 2)
        );
        return (
          distance <
          (enemy.width + enemy.height + player.width + player.height) / 4
        );
      });

      if (hitEnemy) {
        handlePlayerHit();
        gameStateRef.current.enemies = enemies.filter(
          (enemy) => enemy !== hitEnemy
        );
      }
    }
  };

  /**
   * Checks for collisions between the player and canvas boundaries.
   */
  const checkBoundaryCollisions = () => {
    const { player } = gameStateRef.current;
    const canvas = canvasRef.current;
    player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
    player.y = Math.max(0, Math.min(player.y, canvas.height - player.height));
  };

  /**
   * Handles player getting hit.
   */
  const handlePlayerHit = () => {
    const { player } = gameStateRef.current;
    player.life--;
    player.invincible = true;
    setTimeout(() => {
      if (gameStateRef.current) {
        gameStateRef.current.player.invincible = false;
      }
    }, 2000);
    if (player.life <= 0) {
      setIsGamePaused(true);
    }
  };

  /**
   * Restarts the game.
   */
  const restartGame = useCallback(() => {
    gameStateRef.current = {
      ...gameStateRef.current,
      player: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        width: 25.5,
        height: 25.5,
        life: 3,
        stamina: 2,
        dexterity: 1,
        speed: 2,
        rollCooldown: 0,
        invincible: false
      },
      enemies: Array(10)
        .fill()
        .map(() => spawnEnemy()),
      projectiles: [],
      score: 0,
      enemySpawnTime: 300,
      enemyMaxSpeed: 0.8
    };
    setScore(0);
    setIsGamePaused(false);
    frameRef.current = 0;
    lastUpdateTimeRef.current = Date.now();
  }, [spawnEnemy]);

  const handleRoll = () => {
    const { player } = gameStateRef.current;
    const now = Date.now();

    if (now - lastRollTimeRef.current > player.rollCooldown * 1000) {
      lastRollTimeRef.current = now;
      player.invincible = true;
      setTimeout(() => {
        if (gameStateRef.current) {
          gameStateRef.current.player.invincible = false;
        }
      }, 500); // Adjust the duration of invincibility during the roll
    }
  };

  /**
   * Handles key down events.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  const handleKeyDown = useCallback((event) => {
    keysPressed.current[event.code] = true;
    if (event.code === "Space") handleRoll();
  }, []);

  /**
   * Handles key up events.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  const handleKeyUp = useCallback((event) => {
    keysPressed.current[event.code] = false;
  }, []);

  /**
   * Handles shooting projectiles.
   */
  const handleShoot = useCallback(() => {
    const { player } = gameStateRef.current;
    const scale = window.devicePixelRatio;
    const x = mousePosition.x * scale;
    const y = mousePosition.y * scale;
    const angle = Math.atan2(
      y - (player.y + player.height / 2) * scale,
      x - (player.x + player.width / 2) * scale
    );
    gameStateRef.current.projectiles.push({
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      angle,
      speed: 10,
      width: 5,
      height: 5
    });
  }, [mousePosition]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio;

      setMousePosition({
        x: (e.clientX - rect.left) * scale,
        y: (e.clientY - rect.top) * scale
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  /**
   * Handles player upgrades.
   * @param {string} upgradeType - The type of upgrade.
   */
  const handleUpgrade = useCallback((upgradeType) => {
    const { player } = gameStateRef.current;
    const upgradeActions = {
      life: () => player.life++,
      stamina: () => player.stamina++,
      dexterity: () => player.dexterity++,
      speed: () => {
        player.speed += 0.5;
      }
    };
    upgradeActions[upgradeType]();
    setShowUpgrade(false);
    setIsGamePaused(false);
  }, []);

  /**
   * Handles player movement.
   */
  const handlePlayerMovement = () => {
    const { player } = gameStateRef.current;
    const speed = player.speed;

    const move = (dx, dy) => {
      player.x += dx;
      player.y += dy;
    };

    if (keysPressed.current["ArrowUp"] || keysPressed.current["KeyW"])
      move(0, -speed);
    if (keysPressed.current["ArrowDown"] || keysPressed.current["KeyS"])
      move(0, speed);
    if (keysPressed.current["ArrowLeft"] || keysPressed.current["KeyA"])
      move(-speed, 0);
    if (keysPressed.current["ArrowRight"] || keysPressed.current["KeyD"])
      move(speed, 0);

    checkBoundaryCollisions();
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    const resizeCanvas = () => {
      const scale = window.devicePixelRatio;
      canvas.width = Math.floor(canvas.parentElement.clientWidth * scale);
      canvas.height = Math.floor(canvas.parentElement.clientHeight * scale);
      canvas.style.width = `${canvas.width / scale}px`;
      canvas.style.height = `${canvas.height / scale}px`;

      if (
        gameStateRef.current.player.x === 0 &&
        gameStateRef.current.player.y === 0
      ) {
        gameStateRef.current.player.x =
          canvas.width / (2 * scale) - gameStateRef.current.player.width / 2;
        gameStateRef.current.player.y =
          canvas.height / (2 * scale) - gameStateRef.current.player.height / 2;
      }
    };

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("click", handleShoot);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("click", handleShoot);
    };
  }, [handleKeyDown, handleKeyUp, handleShoot]);

  useEffect(() => {
    let animationFrameId;

    const gameLoop = () => {
      if (!isGamePaused && gameStateRef.current) {
        const canvas = canvasRef.current;

        if (canvas) {
          const context = canvas.getContext("2d");

          const { player, enemies, projectiles } = gameStateRef.current;

          context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before drawing

          context.fillStyle = "#3498DB";
          drawRoundedRect(
            context,
            player.x,
            player.y,
            player.width,
            player.height,
            6
          );

          drawEntities(context, enemies, "#EF4444", 6);
          drawEntities(context, projectiles, "#3498DB", 2);

          updateGameState();
          handlePlayerMovement();
          setScore(gameStateRef.current.score);

          frameRef.current++;
          if (frameRef.current >= gameStateRef.current.enemySpawnTime) {
            gameStateRef.current.enemies.push(spawnEnemy());
            gameStateRef.current.enemySpawnTime *= 0.95;
            frameRef.current = 0;
          }
        }
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isGamePaused, updateGameState, handlePlayerMovement, spawnEnemy]);

  return (
    <>
      <div className="game-container" tabIndex="0">
        <canvas ref={canvasRef} />
        {(isGamePaused || showUpgrade) && (
          <div className="overlay row">
            {showUpgrade && (
              <div className="upgrade-options row">
                <h2>Choose an Upgrade</h2>
                <div className="row flow-row-nowrap">
                  <button
                    type="button"
                    onClick={() => handleUpgrade("life")}
                    className="action"
                  >
                    Life
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpgrade("stamina")}
                    className="action"
                  >
                    Stamina
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpgrade("dexterity")}
                    className="action"
                  >
                    Dexterity
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpgrade("speed")}
                    className="action"
                  >
                    Speed
                  </button>
                </div>
              </div>
            )}
            {isGamePaused &&
              !showUpgrade &&
              gameStateRef.current.player.life <= 0 && (
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
        )}
      </div>
      <div>
        <p>Score: {score}</p>
        <p>Life: {gameStateRef.current.player.life}</p>
        <p>Stamina: {gameStateRef.current.player.stamina}</p>
        <p>Dexterity: {gameStateRef.current.player.dexterity}</p>
        <p>Speed: {gameStateRef.current.player.speed.toFixed(1)}</p>
        <p>Enemies Defeated: {gameStateRef.current.enemiesDefeated}</p>
      </div>
    </>
  );
};

export default GameCanvas;
