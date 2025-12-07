import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [modelSRC, setModelSRC] = useState("/models/new_appartment.glb");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (type) => {
    setIsDropdownOpen(false);
    if (type === "marker") navigate("/viewerarmarker");
    else if (type === "markerless") navigate("/viewerarmarkerless");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-200 w-[100%]">
      <h1 className="text-lg font-semibold mb-10">Welcome to RealtyAR</h1>

      <button
        onClick={() => navigate("/viewer3d")}
        className="bg-blue-500 text-white px-10 py-5 rounded-2xl mb-6"
      >
        3D Viewer
      </button>

      {/* <button
        onClick={() => navigate("/viewerAR")}
        className="bg-blue-500 text-white px-10 py-5 rounded-2xl"
      >
        AR Viewer
      </button> */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="bg-blue-500 text-white px-10 py-5 rounded-2xl mb-3 hover:bg-blue-700 transition"
        >
          AR Options ▾
        </button>
        {isDropdownOpen && (
          <div className="absolute bottom-[-100%] mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
            <button
              onClick={() => handleSelect("marker")}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Marker-based AR
            </button>
            <button
              onClick={() => handleSelect("markerless")}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Markerless AR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
