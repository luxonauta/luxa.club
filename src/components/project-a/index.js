"use client";

import React, { useState } from "react";
import "./index.scss";
import GameCanvas from "./game-canvas";

const ProjectA = () => {
  const [showGame, setShowGame] = useState(false);

  return (
    <div id="project-a" className="card row flow-column-wrap align-start">
      <div>
        <h2>Project A</h2>
        <p>Jump, dodge and collect. Survive the challenges.</p>
      </div>
      <button
        type="button"
        onClick={() => setShowGame(true)}
        className="action primary"
      >
        Play
      </button>
      {showGame && <GameCanvas />}
    </div>
  );
};

export default ProjectA;
