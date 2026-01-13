import React, { useState, useEffect } from "react";

export default function ToggleSwitch({isEnabled}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(()=>{
    isEnabled = enabled;
  },[enabled])

  return (
    <div
      onClick={() => {setEnabled(!enabled)}}
      className={`w-10 h-5 m-10 absolute flex items-center rounded-full p-1 cursor-pointer ${
        enabled ? "bg-blue-700" : "bg-gray-400"
      }`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      ></div>
    </div>
  );
}
