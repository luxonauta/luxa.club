import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import useSound from "use-sound";
import { upsertScore } from "@/utils/supabase/actions";

const getInitialGameState = () => [
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
  const [gameState, setGameState] = useState(getInitialGameState());
  const [currentStep, setCurrentStep] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const [shakeIndex, setShakeIndex] = useState(null);
  const [awaitingPortal, setAwaitingPortal] = useState(false);

  const [playTrue] = useSound(TRUE_SOUND_URL, { volume: 1.0 });
  const [playFalse] = useSound(FALSE_SOUND_URL, { volume: 1.0 });

  /**
   * Handles the click event on a block
   * @param {number} index - The index of the clicked block
   */
  const handleClick = (index) => {
    if (gameOver) return;

    const block = gameState[index];

    if (awaitingPortal && block.type !== "portal") {
      handleIncorrectStep(index);
      return;
    }

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
   * Handles the double click event on a block
   * @param {Object} block - The block object
   * @param {number} index - The index of the clicked block
   */
  const handleDoubleClick = (block, index) => {
    if (block.solution.includes(currentStep)) {
      block.solution = block.solution.filter((step) => step !== currentStep);
      block.partialSolution = block.partialSolution
        ? [...block.partialSolution, currentStep]
        : [currentStep];

      if (block.solution.length === 0) block.activated = true;

      playTrue();
      setCurrentStep(currentStep + 1);
    } else {
      handleIncorrectStep(index);
    }

    updateGameState(index, block);
  };

  /**
   * Handles the single click event on a block
   * @param {Object} block - The block object
   * @param {number} index - The index of the clicked block
   */
  const handleSingleClick = async (block, index) => {
    if (currentStep === block.solution) {
      block.activated = true;
      playTrue();
      setCurrentStep(currentStep + 1);

      if (block.type === "final") {
        const score = 300 - (3 - lives) * 100;

        try {
          upsertScore(score);
        } catch (error) {
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
   * Handles the portal click event on a block
   * @param {Object} block - The block object
   * @param {number} index - The index of the clicked block
   */
  const handlePortalClick = (block, index) => {
    if (awaitingPortal) {
      if (currentStep === block.solution) {
        block.activated = true;
        playTrue();
        setCurrentStep(currentStep + 1);
        setAwaitingPortal(false);
      } else {
        handleIncorrectStep(index);
      }
    } else {
      if (currentStep === block.solution) {
        block.activated = true;
        playTrue();
        setCurrentStep(currentStep + 1);
        setAwaitingPortal(true);
      } else {
        handleIncorrectStep(index);
      }
    }

    updateGameState(index, block);
  };

  /**
   * Handles incorrect step
   * @param {number} index - The index of the clicked block
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
   * Updates the game state for a block
   * @param {number} index - The index of the block
   * @param {Object} block - The block object
   */
  const updateGameState = (index, block) => {
    setGameState((prevGameState) =>
      prevGameState.map((b, i) => (i === index ? block : b))
    );
  };

  useEffect(() => {
    if (shakeIndex !== null) {
      const timer = setTimeout(() => {
        setShakeIndex(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [shakeIndex]);

  /**
   * Restarts the game
   */
  const restartGame = () => {
    setGameState(
      getInitialGameState().map((block) => ({
        ...block,
        activated: false,
        partialSolution: undefined,
        solution: Array.isArray(block.solution)
          ? [...block.solution]
          : block.solution,
        type: block.type
      }))
    );
    setCurrentStep(1);
    setGameOver(false);
    setLives(3);
    setShakeIndex(null);
    setAwaitingPortal(false);
  };

  /**
   * Renders a block
   * @param {Object} block - The block object
   * @param {number} index - The index of the block
   * @returns {JSX.Element} The block element
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
          <div className="overlay row flow-column-wrap">
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
