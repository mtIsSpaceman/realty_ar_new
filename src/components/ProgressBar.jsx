// src/components/ProgressBar.js
import React from "react";

const ProgressBar = ({ progress }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "50%",
        height: "10px",
        background: "#eee",
        borderRadius: "5px",
        overflow: "hidden",
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: "100%",
          background: "#007bff",
          transition: "width 0.2s ease",
        }}
      />
    </div>
  );
};

export default ProgressBar;
