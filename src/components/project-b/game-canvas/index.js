import React, { useState } from "react";
import { toast } from "react-hot-toast";
import useSound from "use-sound";

/**
 * Initial game state array containing block information.
 */
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

/**
 * The GameCanvas component represents the game interface and logic.
 * @returns {JSX.Element} The game canvas element.
 */
const GameCanvas = () => {
  const [gameState, setGameState] = useState(initialGameState);
  const [currentStep, setCurrentStep] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const [shakeIndex, setShakeIndex] = useState(null);

  const [playTrue] = useSound(TRUE_SOUND_URL, { volume: 1.0 });
  const [playFalse] = useSound(FALSE_SOUND_URL, { volume: 1.0 });

  /**
   * Handles the click event for a block.
   * @param {number} index - The index of the clicked block.
   */
  const handleClick = (index) => {
    if (gameOver) return;

    const block = gameState[index];

    switch (block.type) {
      case "double":
        handleDoubleClick(block, index);
        break;
      case "portal":
        handlePortalClick(block, index);
        break;
      default:
        handleSingleClick(block, index);
        break;
    }
  };

  /**
   * Handles a double click event for a block.
   * @param {Object} block - The block object.
   * @param {number} index - The index of the block.
   */
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

    updateGameState(index, block);
  };

  /**
   * Handles a single click event for a block.
   * @param {Object} block - The block object.
   * @param {number} index - The index of the block.
   */
  const handleSingleClick = async (block, index) => {
    if (currentStep === block.solution) {
      block.activated = true;
      playTrue();
      setCurrentStep(currentStep + 1);

      if (block.type === "final") {
        try {
          await upsertScore(0, currentStep);
        } catch (error) {
          console.error("Erro ao atualizar a pontuação:", error);
          toast("💁🏻 Hey, sign in to be on the Leaderboard!");
        }

        setGameOver(true);
        toast("Hey you! You won! 🎉");
      }
    } else {
      handleIncorrectStep(index);
    }

    updateGameState(index, block);
  };

  /**
   * Handles a click event for a portal block.
   * @param {Object} block - The block object.
   * @param {number} index - The index of the block.
   */
  const handlePortalClick = (block, index) => {
    if (currentStep === block.solution) {
      block.activated = true;
      playTrue();
      setCurrentStep(currentStep + 1);

      const otherPortalIndex = gameState.findIndex(
        (b) => b.type === "portal" && b !== block && !b.activated
      );
      if (otherPortalIndex !== -1) {
        const otherPortalBlock = gameState[otherPortalIndex];
        otherPortalBlock.activated = true;
        setCurrentStep(currentStep + 1);
        playTrue();
        updateGameState(otherPortalIndex, otherPortalBlock);
      }
    } else {
      handleIncorrectStep(index);
    }

    updateGameState(index, block);
  };

  /**
   * Handles the event when an incorrect step is made.
   * @param {number} index - The index of the block.
   */
  const handleIncorrectStep = (index) => {
    setLives((prevLives) => {
      const newLives = prevLives - 1;

      if (newLives <= 0) {
        if (!gameOver) {
          setGameOver(true);
          toast("Game Over! 😓");
        }
      }

      return newLives;
    });

    setShakeIndex(index);
    playFalse();
    navigator.vibrate(200);

    setTimeout(() => {
      setShakeIndex(null);
    }, 300);
  };

  /**
   * Updates the game state with a new block state.
   * @param {number} index - The index of the block.
   * @param {Object} block - The block object.
   */
  const updateGameState = (index, block) => {
    setGameState((prevGameState) =>
      prevGameState.map((b, i) => (i === index ? block : b))
    );
  };

  /**
   * Restarts the game by resetting the state.
   */
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

  /**
   * Renders a single block element.
   * @param {Object} block - The block object.
   * @param {number} index - The index of the block.
   * @returns {JSX.Element} The rendered block element.
   */
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
    <>
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
      <p>
        Click on blocks in the correct order to progress. 🟣 Activate purple
        blocks twice. 🔵 Blue blocks are portals; after entering one, click the
        other portal to continue.
      </p>
    </>
  );
};

export default GameCanvas;
