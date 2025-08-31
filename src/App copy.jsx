import React, { useState } from "react";
import "./App.css";
import ARScene from "./components/ARScene";
import ModelViewer from "./components/ModelViewer";

function App() {
  const [view, setView] = useState("3d");
  const [modelSRC, setModelSRC] = useState("/models/new_appartment.glb")

  return (
    <div>
      <div className="button_container">
        <button onClick={() => setView("3d")}>3D View</button>
        <button onClick={() => setView("ar")}>AR View</button>
      </div>
      <div className="button_container_models">
        <button onClick={() => setModelSRC("/models/new_appartment.glb")}>Appartment 1</button>
        <button onClick={() => setModelSRC("/models/appartment_final.glb")}>Appartment 2</button>
      </div>

      {/* <div style={{ display: view === "ar" ? "block" : "none" }}>
        <ARScene key={modelSRC}  modelSRC={modelSRC}/>
      </div>
      <div style={{ display: view === "3d" ? "block" : "none" }}>
        <ModelViewer key={modelSRC}  modelSRC={modelSRC}/>
      </div> */}

      {view === "ar" ? <ARScene key={modelSRC}  modelSRC={modelSRC}/> : <ModelViewer key={modelSRC}  modelSRC={modelSRC}/>}
    </div>
  );
}

export default App;
