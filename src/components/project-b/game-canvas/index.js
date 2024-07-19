import React, { useState } from "react";
import { toast } from "react-hot-toast";
import useSound from "use-sound";

const initialGameState = [
  { pos: [1, 1], type: "initial", solution: 1 },
  { pos: [2, 2], solution: 2 },
  { pos: [3, 3], solution: 3 },
  { pos: [3, 4], type: "double", solution: [4, 9] },
  { pos: [4, 4], solution: 5 },
  { pos: [4, 5], type: "double", solution: [6, 10] },
  { pos: [5, 4], type: "portal", solution: 7 },
  { pos: [3, 5], type: "portal", solution: 8 },
  { pos: [5, 5], solution: 11 },
  { pos: [6, 6], solution: 12 },
  { pos: [7, 7], solution: 13 },
  { pos: [8, 8], type: "final", solution: 14 }
];

const TRUE_SOUND_URL = "/sounds/true.mp3";
const FALSE_SOUND_URL = "/sounds/false.mp3";

const GameCanvas = () => {
  const [gameState, setGameState] = useState(initialGameState);
  const [currentStep, setCurrentStep] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const [shakeIndex, setShakeIndex] = useState(null);

  const [playTrue] = useSound(TRUE_SOUND_URL, { volume: 1.0 });
  const [playFalse] = useSound(FALSE_SOUND_URL, { volume: 1.0 });

  const handleClick = (index) => {
    if (gameOver) return;

    const newGameState = [...gameState];
    const block = newGameState[index];

    if (block.type === "double") {
      handleDoubleClick(block, index);
    } else {
      handleSingleClick(block, index);
    }

    setGameState(newGameState);
  };

  const handleDoubleClick = (block, index) => {
    if (block.solution.includes(currentStep)) {
      block.solution = block.solution.filter((step) => step !== currentStep);
      block.partialSolution = block.partialSolution
        ? [...block.partialSolution, currentStep]
        : [currentStep];

      if (block.solution.length === 0) {
        block.activated = true;
      }

      playTrue();
      setCurrentStep(currentStep + 1);
    } else {
      handleIncorrectStep(index);
    }

    setGameState((prevGameState) =>
      prevGameState.map((b, i) => (i === index ? block : b))
    );
  };

  const handleSingleClick = (block, index) => {
    if (currentStep === block.solution) {
      block.activated = true;
      playTrue();
      setCurrentStep(currentStep + 1);

      if (block.type === "final") {
        setGameOver(true);
        toast("Hey you! You won! 🎉");
      }
    } else {
      handleIncorrectStep(index);
    }

    setGameState((prevGameState) =>
      prevGameState.map((b, i) => (i === index ? block : b))
    );
  };

  const handleIncorrectStep = (index) => {
    setLives(lives - 1);
    setShakeIndex(index);
    playFalse();
    navigator.vibrate(200);

    setTimeout(() => {
      setShakeIndex(null);
    }, 300);

    if (lives <= 1) {
      setGameOver(true);
      toast("Game Over! 😓");
    }
  };

  const restartGame = () => {
    setGameState(
      initialGameState.map((block) => ({
        ...block,
        activated: false,
        partialSolution: undefined
      }))
    );
    setCurrentStep(1);
    setGameOver(false);
    setLives(3);
    setShakeIndex(null);
  };

  const renderBlock = (block, index) => {
    const style = {
      gridRowStart: block.pos[0],
      gridColumnStart: block.pos[1]
    };

    return (
      <button
        key={index}
        className={`block ${shakeIndex === index ? "shake" : ""}`}
        style={style}
        data-type={block.type}
        onClick={() => handleClick(index)}
      >
        {block.activated || block.partialSolution ? (
          <span>
            {block.partialSolution
              ? block.partialSolution.join("/") +
                (block.solution.length > 0 ? "/?" : "")
              : block.solution}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div className="game-container">
      <div className="canvas">
        {gameState.map((block, index) => renderBlock(block, index))}
      </div>
      {gameOver && (
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
      <div className="lives">Lives: {lives}</div>
    </div>
  );
};

export default GameCanvas;
