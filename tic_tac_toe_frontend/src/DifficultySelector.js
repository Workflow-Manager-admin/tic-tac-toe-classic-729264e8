import React from "react";
import "./ttt.css";

/**
 * Difficulty selection UI for AI opponent.
 * Placed with minimalistic design to match existing controls.
 */
// PUBLIC_INTERFACE
function DifficultySelector({ value, onChange, disabled }) {
  const difficulties = [
    { label: "Easy", value: "easy" },
    { label: "Medium", value: "medium" },
    { label: "Hard", value: "hard" },
  ];
  return (
    <div className="ttt-difficulty-selector" aria-label="AI Difficulty">
      {difficulties.map((diff) => (
        <button
          key={diff.value}
          className={`ttt-difficulty-btn${value === diff.value ? " selected" : ""}`}
          onClick={() => !disabled && onChange(diff.value)}
          disabled={disabled}
          aria-pressed={value === diff.value}
          tabIndex={0}
        >
          {diff.label}
        </button>
      ))}
    </div>
  );
}

export default DifficultySelector;
