import React from "react";
import { Link } from "react-router-dom";
import ToggleSwitch from "./ToggleSwitch";

export default function BottomNav({ active }) {
  return (
    <div className="absolute w-[100vw] bottom-0 bg-blue-500 text-white py-3 flex items-center justify-around rounded-t-2xl">
      
      <Link to="/viewer3d">
        <div
          className={`w-12 h-12 rounded-xl ${
            active === "3d" ? "bg-white text-blue-500" : "bg-blue-400"
          }`}
        ></div>
      </Link>
      <Link to="/viewerar">
        <div
          className={`w-12 h-12 rounded-xl ${
            active === "ar" ? "bg-white text-blue-500" : "bg-blue-400"
          }`}
        ></div>
      </Link>
    </div>
  );
}
