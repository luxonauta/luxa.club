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
        toast("Something went wrong. Please try again later! 😓");
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
              <th>Total Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr key={entry.username + index}>
                <td>@{entry.username}</td>
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
