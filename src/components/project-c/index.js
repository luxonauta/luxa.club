"use client";

import React, { useState } from "react";
import GameCanvas from "./game-canvas";
import "./index.scss";

const ProjectC = () => {
  const [showGame, setShowGame] = useState(false);

  return (
    <div
      id="project-c"
      className="project card row flow-column-wrap align-start"
    >
      <div>
        <h2>Project C</h2>
        <p>Survive as long as you can in a game with rogue-lite elements.</p>
      </div>
      {showGame ? (
        <GameCanvas />
      ) : (
        <button
          type="button"
          onClick={() => setShowGame(true)}
          className="action primary"
        >
          Play
        </button>
      )}
    </div>
  );
};

export default ProjectC;
