"use client";

import React, { useEffect, useState } from "react";
import { getLeaderboard } from "@/utils/supabase/actions";
import "./index.scss";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="leaderboard card row flow-column-wrap align-start">
      <h1>Leaderboard</h1>
      <div className="table" tabIndex={0}>
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Project A</th>
              <th>Project B</th>
              <th>Total Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr key={entry.id}>
                <td>@{entry.username}</td>
                <td>{entry.project_a_score}</td>
                <td>{entry.project_b_score}</td>
                <td>{entry.total_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
