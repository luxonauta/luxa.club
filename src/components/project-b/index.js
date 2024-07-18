"use client";

import React, { useState } from "react";
import GameCanvas from "./game-canvas";
import "./index.scss";

const ProjectB = () => {
  const [showGame, setShowGame] = useState(false);

  return (
    <div
      id="project-b"
      className="project card row flow-column-wrap align-start"
    >
      <div>
        <h2>🏗️ Project B</h2>
        <p>TBD.</p>
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

export default ProjectB;
