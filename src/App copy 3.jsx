import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Viewer3D from "./pages/Viewer3D";
import ViewerAR from "./pages/ViewerAR";
import ViewerARMarker from "./pages/ViewerARMarker";
import ViewerARMarkerless from "./pages/ViewerARMarkerless";

function App() {
    const [modelSRC, setModelSRC] = useState("/models/new_appartment-v1.glb")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/viewer3d" element={<Viewer3D key={modelSRC}  modelSRC={modelSRC}/>} />
        {/* <Route path="/viewerAR" element={<ViewerAR key={modelSRC}  modelSRC={modelSRC}/>} /> */}
        <Route path="/viewerarmarker" element={<ViewerARMarker key={modelSRC}  modelSRC={modelSRC}/>} />
        <Route path="/viewerarmarkerless" element={<ViewerARMarkerless key={modelSRC}  modelSRC={modelSRC}/>} />
      </Routes>
    </div>
  );
}

export default App;