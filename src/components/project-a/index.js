"use client";

import React, { useState } from "react";
import GameCanvas from "./game-canvas";
import "./index.scss";

const ProjectA = () => {
  const [showGame, setShowGame] = useState(false);

  return (
    <div
      id="project-a"
      className="project card row flow-column-wrap align-start"
    >
      <div>
        <h2>Project A</h2>
        <p>Jump, dodge and collect. Survive the challenges.</p>
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

export default ProjectA;
