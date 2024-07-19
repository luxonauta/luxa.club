import React, { useState } from "react";

/**
 * Initial game state configuration
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

/**
 * GameCanvas component
 * @returns {JSX.Element} The game canvas component
 */
const GameCanvas = () => {
  const [gameState, setGameState] = useState(initialGameState);
  const [currentStep, setCurrentStep] = useState(1);
  const [gameOver, setGameOver] = useState(false);

  /**
   * Handle click on a game block
   * @param {number} index - Index of the clicked block
   */
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

  /**
   * Handle click on a double-click block
   * @param {Object} block - The clicked block
   * @param {number} index - Index of the clicked block
   */
  const handleDoubleClick = (block, index) => {
    if (block.solution.includes(currentStep)) {
      block.solution = block.solution.filter((step) => step !== currentStep);

      if (block.solution.length === 0) {
        block.activated = true;
      }

      setCurrentStep(currentStep + 1);
    } else {
      setGameOver(true);
    }

    setGameState((prevGameState) =>
      prevGameState.map((b, i) => (i === index ? block : b))
    );
  };

  /**
   * Handle click on a single-click block
   * @param {Object} block - The clicked block
   * @param {number} index - Index of the clicked block
   */
  const handleSingleClick = (block, index) => {
    if (currentStep === block.solution) {
      block.activated = true;
      setCurrentStep(currentStep + 1);
    } else {
      setGameOver(true);
    }

    setGameState((prevGameState) =>
      prevGameState.map((b, i) => (i === index ? block : b))
    );
  };

  /**
   * Restart the game
   */
  const restartGame = () => {
    setGameState(
      initialGameState.map((block) => ({ ...block, activated: false }))
    );
    setCurrentStep(1);
    setGameOver(false);
  };

  /**
   * Render a single game block
   * @param {Object} block - Block data
   * @param {number} index - Index of the block
   * @returns {JSX.Element} The rendered block element
   */
  const renderBlock = (block, index) => {
    const style = {
      gridRowStart: block.pos[0],
      gridColumnStart: block.pos[1]
    };

    return (
      <button
        key={index}
        className="block"
        style={style}
        data-type={block.type}
        onClick={() => handleClick(index)}
      >
        {block.activated && (
          <span>
            {Array.isArray(block.solution) && block.solution.length > 0
              ? block.solution.join("/")
              : block.solution}
          </span>
        )}
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
    </div>
  );
};

export default GameCanvas;
