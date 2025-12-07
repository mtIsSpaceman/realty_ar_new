import React from "react";
import { Link } from "react-router-dom";
import ToggleSwitch from "./ToggleSwitch";

export default function BottomNav({ active, setModelSRC }) {
  return (
    <div className="absolute w-[100vw] bottom-0 bg-blue-500 text-white py-3 flex items-center justify-around rounded-t-2xl z-10">
      <div
        className={`w-12 h-12 rounded-xl ${
          active === "model_1" ? "bg-white text-blue-500" : "bg-blue-400"
        }`}
        onClick={()=>{
          setModelSRC("/models/new_appartment.glb");
        }}
      ></div>

      <div
        className={`w-12 h-12 rounded-xl ${
          active === "model_2" ? "bg-white text-blue-500" : "bg-blue-400"
        }`}
        onClick={()=>{
          setModelSRC("/models/appartment_final.glb");
        }}
      ></div>

      <div
        className={`w-12 h-12 rounded-xl ${
          active === "model_3" ? "bg-white text-blue-500" : "bg-blue-400"
        }`}
        onClick={()=>{
          setModelSRC("/models/appartment_3.glb");
        }}
      ></div>
    </div>
  );
}
