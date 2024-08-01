import React, { useEffect, useRef, useState } from "react";

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

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [spiders, setSpiders] = useState([]);
  const [player, setPlayer] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    width: 25.5,
    height: 25.5,
    life: 3,
    stamina: 3,
    dexterity: 1,
    speed: 1.5,
    rollCooldown: 0
  });
  const [bullets, setBullets] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    localStorage.getItem("highScore") || 0
  );
  const [spiderSpawnTime, setSpiderSpawnTime] = useState(300);
  const [spiderMaxSpeed, setSpiderMaxSpeed] = useState(0.8);
  const frameRef = useRef(0);
  const keysPressed = useRef({});
  const lastUpdateTimeRef = useRef(Date.now());

  /**
   * Spawns a new spider at a random position outside the viewport.
   */
  const spawnSpider = () => {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    const positionOptions = [
      { x: Math.random() * window.innerWidth, y: -20.5 },
      { x: Math.random() * window.innerWidth, y: window.innerHeight + 20.5 },
      { x: -20.5, y: Math.random() * window.innerHeight },
      { x: window.innerWidth + 20.5, y: Math.random() * window.innerHeight }
    ];

    ({ x, y } = positionOptions[side]);

    setSpiders((prevSpiders) => [
      ...prevSpiders,
      {
        x,
        y,
        speed: Math.random() * spiderMaxSpeed + 0.2,
        width: 20.5,
        height: 20.5
      }
    ]);
  };

  /**
   * Updates the state of the game.
   */
  const updateGameState = () => {
    setSpiders((prevSpiders) =>
      prevSpiders.map((spider) => {
        const dx = player.x - spider.x;
        const dy = player.y - spider.y;
        const angle = Math.atan2(dy, dx);
        return {
          ...spider,
          x: spider.x + Math.cos(angle) * spider.speed,
          y: spider.y + Math.sin(angle) * spider.speed
        };
      })
    );

    setBullets((prevBullets) =>
      prevBullets.map((bullet) => ({
        ...bullet,
        x: bullet.x + Math.cos(bullet.angle) * bullet.speed,
        y: bullet.y + Math.sin(bullet.angle) * bullet.speed
      }))
    );

    checkCollisions();
  };

  /**
   * Checks for collisions between entities.
   */
  const checkCollisions = () => {
    setSpiders((prevSpiders) =>
      prevSpiders.filter((spider) => {
        const hitByBullet = bullets.some((bullet) => {
          const distance = Math.hypot(bullet.x - spider.x, bullet.y - spider.y);
          if (distance < 20.5) {
            setScore((prevScore) => prevScore + player.dexterity);
            return true;
          }
          return false;
        });
        return !hitByBullet;
      })
    );

    const playerHit = spiders.some((spider) => {
      const distance = Math.hypot(spider.x - player.x, spider.y - player.y);
      if (distance < 20.5) {
        if (player.life > 1) {
          setPlayer((prevPlayer) => ({
            ...prevPlayer,
            life: prevPlayer.life - 1
          }));
        } else {
          handleGameOver();
        }
        return true;
      }
      return false;
    });

    if (playerHit) {
      setIsGamePaused(true);
    }
  };

  /**
   * Handles the game over state.
   */
  const handleGameOver = () => {
    setIsGamePaused(true);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("highScore", score);
    }
  };

  /**
   * Restarts the game.
   */
  const restartGame = () => {
    setPlayer({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      width: 25.5,
      height: 25.5,
      life: 3,
      stamina: 3,
      dexterity: 1,
      speed: 1.5,
      rollCooldown: 0
    });
    setSpiders([]);
    setBullets([]);
    setSpiderSpawnTime(300);
    setSpiderMaxSpeed(0.8);
    setScore(0);
    setIsGamePaused(false);
    frameRef.current = 0;
    lastUpdateTimeRef.current = Date.now();
    for (let i = 0; i < 10; i++) {
      spawnSpider();
    }
  };

  /**
   * Handles key down events.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  const handleKeyDown = (event) => {
    keysPressed.current[event.code] = true;
  };

  /**
   * Handles key up events.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  const handleKeyUp = (event) => {
    keysPressed.current[event.code] = false;
  };

  /**
   * Handles shooting bullets.
   * @param {MouseEvent} e - The mouse event.
   */
  const handleShoot = (e) => {
    const angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);
    setBullets((prevBullets) => [
      ...prevBullets,
      {
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        angle,
        speed: 10,
        width: 5,
        height: 5
      }
    ]);
  };

  /**
   * Handles player upgrades.
   * @param {string} upgradeType - The type of upgrade.
   */
  const handleUpgrade = (upgradeType) => {
    const upgrades = {
      life: () =>
        setPlayer((prevPlayer) => ({
          ...prevPlayer,
          life: prevPlayer.life + 1
        })),
      stamina: () =>
        setPlayer((prevPlayer) => ({
          ...prevPlayer,
          stamina: prevPlayer.stamina + 1
        })),
      dexterity: () =>
        setPlayer((prevPlayer) => ({
          ...prevPlayer,
          dexterity: prevPlayer.dexterity + 1
        })),
      speed: () =>
        setPlayer((prevPlayer) => ({
          ...prevPlayer,
          speed: prevPlayer.speed + 0.5
        }))
    };
    upgrades[upgradeType]();
    setIsGamePaused(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const resizeCanvas = () => {
      const scale = window.devicePixelRatio;
      canvas.width = Math.floor(canvas.parentElement.clientWidth * scale);
      canvas.height = Math.floor(canvas.width / 2);
      canvas.style.width = `${canvas.width / scale}px`;
      canvas.style.height = `${canvas.height / scale}px`;
      setPlayer((prevPlayer) => ({
        ...prevPlayer,
        x: canvas.width / 2 / scale,
        y: canvas.height / 2 / scale
      }));
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
  }, []);

  useEffect(() => {
    const gameLoop = () => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!isGamePaused) {
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw player with rounded corners
        context.fillStyle = "#3498DB";
        drawRoundedRect(
          context,
          player.x,
          player.y,
          player.width,
          player.height,
          6
        );

        drawEntities(context, spiders, "#EF4444", 6);
        drawEntities(context, bullets, "#3498DB", 2);

        updateGameState();

        frameRef.current++;
        if (frameRef.current >= spiderSpawnTime) {
          spawnSpider();
          setSpiderSpawnTime((prevTime) => prevTime * 0.95);
          frameRef.current = 0;
        }

        const currentTime = Date.now();
        if (currentTime - lastUpdateTimeRef.current >= 60000) {
          setIsGamePaused(true);
          lastUpdateTimeRef.current = currentTime;
        }

        const speed = player.speed;
        const movePlayer = (dx, dy) => {
          setPlayer((prevPlayer) => ({
            ...prevPlayer,
            x: Math.max(
              0,
              Math.min(
                canvas.width / window.devicePixelRatio - player.width,
                prevPlayer.x + dx
              )
            ),
            y: Math.max(
              0,
              Math.min(
                canvas.height / window.devicePixelRatio - player.height,
                prevPlayer.y + dy
              )
            )
          }));
        };

        if (keysPressed.current["ArrowUp"] || keysPressed.current["KeyW"])
          movePlayer(0, -speed);
        if (keysPressed.current["ArrowDown"] || keysPressed.current["KeyS"])
          movePlayer(0, speed);
        if (keysPressed.current["ArrowLeft"] || keysPressed.current["KeyA"])
          movePlayer(-speed, 0);
        if (keysPressed.current["ArrowRight"] || keysPressed.current["KeyD"])
          movePlayer(speed, 0);
      }

      requestAnimationFrame(gameLoop);
    };

    gameLoop();
  }, [isGamePaused, player]);

  return (
    <div className="game-container" tabIndex="0">
      <canvas ref={canvasRef} />
      {isGamePaused && (
        <div className="overlay">
          {player.life > 0 ? (
            <div className="upgrade-options">
              <h2>Choose an Upgrade</h2>
              <button onClick={() => handleUpgrade("life")}>
                Increase Life
              </button>
              <button onClick={() => handleUpgrade("stamina")}>
                Increase Stamina
              </button>
              <button onClick={() => handleUpgrade("dexterity")}>
                Increase Dexterity
              </button>
              <button onClick={() => handleUpgrade("speed")}>
                Increase Speed
              </button>
            </div>
          ) : (
            <div className="game-over">
              <h2>Game Over</h2>
              <p>Current Score: {score}</p>
              <p>High Score: {highScore}</p>
              <button onClick={restartGame}>Restart</button>
            </div>
          )}
        </div>
      )}
      <div className="score">Score: {score}</div>
    </div>
  );
};

export default GameCanvas;
