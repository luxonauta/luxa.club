import React, { useEffect, useRef, useState, useCallback } from "react";
import useSound from "use-sound";
import { drawRoundedRect } from "@/utils/draw-rounded-rect";
import Cookies from "js-cookie";
import { upsertScore } from "@/utils/supabase/actions";

/**
 * Initializes the game state.
 * @returns {Object} The initial game state.
 */
const initializeGameState = () => {
  return {
    player: {
      x: 0,
      y: 0,
      width: 25.5,
      height: 25.5,
      life: 3,
      stamina: 1,
      speed: 1,
      rollCooldown: 1,
      invincible: false,
      isRolling: false,
      rollDirection: { x: 0, y: 0 },
      rollDistance: 0,
      rollSpeed: 10,
      maxRollDistance: Math.sqrt(12.75 ** 2 * 2) * 2,
      multishot: 1,
      upgrades: 0,
      shadows: []
    },
    enemies: [],
    projectiles: [],
    score: 0,
    highScore: Cookies.get("c-best-score") || 0,
    enemySpawnTime: 300,
    enemyMaxSpeed: 0.8,
    enemiesDefeated: 0
  };
};

/**
 * Draws multiple entities on the canvas.
 * @param {CanvasRenderingContext2D} context - The canvas rendering context.
 * @param {Array<Object>} entities - The entities to draw.
 * @param {string} color - The color of the entities.
 * @param {number} cornerRadius - The radius of the corners.
 */
const drawEntities = (context, entities, color, cornerRadius = 0) => {
  context.fillStyle = color;
  entities.forEach(({ x, y, width, height }) => {
    drawRoundedRect(context, x, y, width, height, cornerRadius);
  });
};

const ROLL_SOUND_URL = "/sounds/roll.mp3";
const SHOOT_SOUND_URL = "/sounds/shoot.mp3";
const SPAWN_ENEMY_SOUND_URL = "/sounds/spawn-enemy.mp3";

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(initializeGameState());
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [score, setScore] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const frameRef = useRef(0);
  const keysPressed = useRef({});
  const lastUpdateTimeRef = useRef(Date.now());
  const lastRollTimeRef = useRef(Date.now());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [enemiesToNextUpgrade, setEnemiesToNextUpgrade] = useState(10);
  const [shouldPlaySpawnSound, setShouldPlaySpawnSound] = useState(true);

  const [playRoll] = useSound(ROLL_SOUND_URL, { volume: 1 });
  const [playShoot] = useSound(SHOOT_SOUND_URL, { volume: 0.3 });
  const [playSpawnEnemy] = useSound(SPAWN_ENEMY_SOUND_URL, {
    playbackRate: 1.5,
    volume: 0.1,
    interrupt: true
  });

  /**
   * Spawns a new enemy at a random position around the canvas.
   * @returns {Object} The new enemy.
   */
  const spawnEnemy = useCallback(() => {
    if (shouldPlaySpawnSound) playSpawnEnemy();
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
  }, [playSpawnEnemy, shouldPlaySpawnSound]);

  /**
   * Updates the game state including player, enemies, and projectiles.
   */
  const updateGameState = () => {
    const now = Date.now();
    const deltaTime = Math.min((now - lastUpdateTimeRef.current) / 1000, 0.1);
    lastUpdateTimeRef.current = now;

    updateRoll(deltaTime);
    updateEnemies(deltaTime);
    updateProjectiles(deltaTime);

    checkCollisions();
    checkBoundaryCollisions();
  };

  /**
   * Updates the roll state of the player.
   * @param {number} deltaTime - The time elapsed since the last update.
   */
  const updateRoll = (deltaTime) => {
    const { player } = gameStateRef.current;
    if (player.isRolling) {
      const rollStep = player.rollSpeed * deltaTime * 60;
      player.rollDistance += rollStep;
      player.x += player.rollDirection.x * rollStep;
      player.y += player.rollDirection.y * rollStep;

      player.shadows.push({ x: player.x, y: player.y, opacity: 1 });

      if (player.rollDistance >= player.maxRollDistance) {
        player.isRolling = false;
        player.invincible = false;
      }
    }

    player.shadows = player.shadows
      .map((shadow) => ({
        ...shadow,
        opacity: shadow.opacity - 0.05
      }))
      .filter((shadow) => shadow.opacity > 0);
  };

  /**
   * Updates the positions of all enemies.
   * @param {number} deltaTime - The time elapsed since the last update.
   */
  const updateEnemies = (deltaTime) => {
    const { player, enemies } = gameStateRef.current;
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
  };

  /**
   * Updates the positions of all projectiles.
   * @param {number} deltaTime - The time elapsed since the last update.
   */
  const updateProjectiles = (deltaTime) => {
    const { projectiles } = gameStateRef.current;
    gameStateRef.current.projectiles = projectiles.map((projectile) => ({
      ...projectile,
      x:
        projectile.x +
        Math.cos(projectile.angle) * projectile.speed * deltaTime * 60,
      y:
        projectile.y +
        Math.sin(projectile.angle) * projectile.speed * deltaTime * 60
    }));
  };

  /**
   * Checks for collisions between entities and handles them accordingly.
   */
  const checkCollisions = () => {
    const { player, enemies, projectiles } = gameStateRef.current;

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
        setScore(gameStateRef.current.score);

        if (gameStateRef.current.enemiesDefeated >= enemiesToNextUpgrade) {
          setShowUpgrade(true);
          setIsGamePaused(true);
        }

        if (gameStateRef.current.enemiesDefeated >= 30) {
          setShouldPlaySpawnSound(false); // Stop playing the spawn sound after defeating 30 enemies
        }

        return false;
      }
      return true;
    });

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
   * Ensures the player remains within the canvas boundaries.
   */
  const checkBoundaryCollisions = () => {
    const { player } = gameStateRef.current;
    const canvas = canvasRef.current;
    player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
    player.y = Math.max(0, Math.min(player.y, canvas.height - player.height));
  };

  /**
   * Handles the event when the player is hit by an enemy.
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

      try {
        upsertScore(score);
      } catch (error) {
        toast("💁🏻 Hey, sign in to be on the Leaderboard!");
      }

      if (gameStateRef.current.score > gameStateRef.current.highScore) {
        gameStateRef.current.highScore = gameStateRef.current.score;
        Cookies.set("c-best-score", gameStateRef.current.score.toFixed(2), {
          expires: 365
        });
      }
    }
  };

  /**
   * Restarts the game by reinitializing the game state.
   */
  const restartGame = useCallback(() => {
    gameStateRef.current = {
      ...gameStateRef.current,
      ...initializeGameState(),
      enemies: Array(10)
        .fill()
        .map(() => spawnEnemy())
    };
    setScore(0);
    setIsGamePaused(false);
    frameRef.current = 0;
    lastUpdateTimeRef.current = Date.now();
    setShouldPlaySpawnSound(true); // Reset the spawn sound state
  }, [spawnEnemy]);

  /**
   * Initiates a roll action for the player.
   */
  const handleRoll = () => {
    const { player } = gameStateRef.current;
    const now = Date.now();

    if (
      now - lastRollTimeRef.current > player.rollCooldown * 1000 &&
      !player.isRolling
    ) {
      lastRollTimeRef.current = now;
      player.isRolling = true;
      player.invincible = true;
      player.rollDistance = 0;
      playRoll();

      const rollDirectionX =
        keysPressed.current["ArrowRight"] || keysPressed.current["KeyD"]
          ? 1
          : keysPressed.current["ArrowLeft"] || keysPressed.current["KeyA"]
          ? -1
          : 0;
      const rollDirectionY =
        keysPressed.current["ArrowDown"] || keysPressed.current["KeyS"]
          ? 1
          : keysPressed.current["ArrowUp"] || keysPressed.current["KeyW"]
          ? -1
          : 0;

      player.rollDirection = {
        x: rollDirectionX,
        y: rollDirectionY
      };

      if (rollDirectionX !== 0 && rollDirectionY !== 0) {
        const magnitude = Math.sqrt(
          rollDirectionX * rollDirectionX + rollDirectionY * rollDirectionY
        );
        player.rollDirection.x /= magnitude;
        player.rollDirection.y /= magnitude;
      }
    }
  };

  /**
   * Handles keydown events to update key states and initiate roll action.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  const handleKeyDown = useCallback((event) => {
    keysPressed.current[event.code] = true;
    if (event.code === "Space") handleRoll();
  }, []);

  /**
   * Handles keyup events to update key states.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  const handleKeyUp = useCallback((event) => {
    keysPressed.current[event.code] = false;
  }, []);

  /**
   * Handles shooting action by creating projectiles.
   */
  const handleShoot = useCallback(() => {
    playShoot();
    const { player } = gameStateRef.current;
    const scale = window.devicePixelRatio;
    const x = mousePosition.x * scale;
    const y = mousePosition.y * scale;
    const baseAngle = Math.atan2(
      y - (player.y + player.height / 2) * scale,
      x - (player.x + player.width / 2) * scale
    );

    for (let i = 0; i < player.multishot; i++) {
      const angle = baseAngle + (i - Math.floor(player.multishot / 2)) * 0.1;
      gameStateRef.current.projectiles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        angle,
        speed: 10,
        width: 5,
        height: 5
      });
    }
  }, [mousePosition, playShoot]);

  useEffect(() => {
    /**
     * Updates the mouse position state on mouse move.
     * @param {MouseEvent} e - The mouse event.
     */
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
   * Handles upgrade selection and applies the upgrade to the player.
   * @param {string} upgradeType - The type of upgrade selected.
   */
  const handleUpgrade = useCallback(
    (upgradeType) => {
      const { player } = gameStateRef.current;
      const upgradeActions = {
        life: () => player.life++,
        stamina: () => player.stamina++,
        speed: () => (player.speed += 0.5),
        multishot: () => (player.multishot += 1)
      };

      if (upgradeActions[upgradeType]) {
        upgradeActions[upgradeType]();
        player.upgrades++;
        setEnemiesToNextUpgrade(enemiesToNextUpgrade * 2);
        setShowUpgrade(false);
        setIsGamePaused(false);
      }
    },
    [enemiesToNextUpgrade]
  );

  /**
   * Handles player movement based on the pressed keys.
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

    /**
     * Resizes the canvas to fit the parent element.
     */
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

    /**
     * The main game loop that updates and renders the game.
     */
    const gameLoop = () => {
      if (!isGamePaused && gameStateRef.current) {
        const canvas = canvasRef.current;

        if (canvas) {
          const context = canvas.getContext("2d");

          const { player, enemies, projectiles } = gameStateRef.current;

          context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before drawing

          player.shadows.forEach((shadow) => {
            context.fillStyle = `rgba(14, 165, 233, ${shadow.opacity})`;
            drawRoundedRect(
              context,
              shadow.x,
              shadow.y,
              player.width,
              player.height,
              6
            );
          });

          context.fillStyle = "#0EA5E9";
          drawRoundedRect(
            context,
            player.x,
            player.y,
            player.width,
            player.height,
            6
          );

          drawEntities(context, enemies, "#EF4444", 6);
          drawEntities(context, projectiles, "#0EA5E9", 2);

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
                    onClick={() => handleUpgrade("speed")}
                    className="action"
                  >
                    Speed
                  </button>
                  {gameStateRef.current.player.upgrades >= 2 && (
                    <button
                      type="button"
                      onClick={() => handleUpgrade("multishot")}
                      className="action"
                    >
                      Multishot
                    </button>
                  )}
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
      <div className="table" tabIndex={0}>
        <table>
          <thead>
            <tr>
              <th>Score</th>
              <th>Life</th>
              <th>Stamina</th>
              <th>Speed</th>
              <th>Enemies defeated</th>
              <th>Best score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{score}</td>
              <td>{gameStateRef.current.player.life}</td>
              <td>{gameStateRef.current.player.stamina}</td>
              <td>{gameStateRef.current.player.speed.toFixed(1)}</td>
              <td>{gameStateRef.current.enemiesDefeated}</td>
              <td>{gameStateRef.current.highScore}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Control using the arrow keys or WASD. Click to shoot at enemies. Survive
        and defeat as many enemies as possible. Collect upgrades to improve your
        abilities. Roll using the spacebar to dodge enemies and become
        temporarily invincible. The game ends when you lose all your lives.
      </p>
    </>
  );
};

export default GameCanvas;
