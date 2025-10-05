import React, { useEffect, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Viewer3D from "./pages/Viewer3D";
import ViewerAR from "./pages/ViewerARMarker";

function App() {
    const [modelSRC, setModelSRC] = useState("/models/new_appartment.glb")
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/viewer3d" element={<Viewer3D key={modelSRC}  modelSRC={modelSRC}/>} />
        <Route path="/viewerarmarker" element={<ViewerAR key={modelSRC}  modelSRC={modelSRC}/>} />
      </Routes>
    </div>
  );
}

export default App;