import React from "react";
import BottomNav from "../components/BottomNav";
import ToggleSwitch from "../components/ToggleSwitch";
import { useNavigate } from "react-router-dom";

export default function ViewerAR() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-between h-screen bg-gray-200 w-[100%]">
      <ToggleSwitch />
      <div className="flex flex-col justify-center items-center flex-1">
        <h2 className="text-lg font-semibold mb-6">AR Viewer</h2>
        <button className="bg-blue-500 text-white px-10 py-5 rounded-2xl mb-6">
          I have a marker
        </button>
        <button className="bg-blue-500 text-white px-10 py-5 rounded-2xl">
          View in my space
        </button>
      </div>
      <BottomNav active="ar" />
    </div>
  );
}
