import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-200 w-[100%]">
      <h1 className="text-lg font-semibold mb-10">Welcome to RealtyAR</h1>

      <button
        onClick={() => navigate("/viewer3d")}
        className="bg-blue-500 text-white px-10 py-5 rounded-2xl mb-6"
      >
        3D Viewer
      </button>

      <button
        onClick={() => navigate("/viewerarmarker")}
        className="bg-blue-500 text-white px-10 py-5 rounded-2xl"
      >
        AR Viewer
      </button>
    </div>
  );
}
