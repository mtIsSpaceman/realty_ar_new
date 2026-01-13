import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import BottomNav from "../components/BottomNav";
import ToggleSwitch from "../components/ToggleSwitch";
import Loader from "../components/Loader";
// import Hotspots from "../components/Hotspots";

export default function ViewerAR({ modelSRC }) {
  const mountRef = useRef(null);
  const overlayRef = useRef(null);

  const modelRef = useRef(null);
  const reticleRef = useRef(null);

  const pinchData = useRef({
    isPinching: false,
    startDistance: 0,
    startScale: new THREE.Vector3(),
  });

  const [loaded, setLoaded] = useState(false);
  const [modelName, setModelName] = useState("model_1");
  const [modelSRCState, setModelSRCState] = useState(modelSRC);
  const [areHotspotsVisible, setAreHotspotsVisible] = useState(false);

  const three = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controller: null,
    hitTestSource: null,
    localSpace: null,
    placed: false,
  }).current;

  const [currentModel, setCurrentModel] = useState(modelSRC);
  const loader = new GLTFLoader();

  /* ------------------ Utils ------------------ */

  const getDistance = (t1, t2) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  /* ------------------ Init AR ------------------ */

  useEffect(() => {
    const container = mountRef.current;

    three.scene = new THREE.Scene();
    three.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );

    three.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    three.renderer.setSize(window.innerWidth, window.innerHeight);
    three.renderer.setClearColor(0x000000, 0);
    three.renderer.xr.enabled = true;
    container.appendChild(three.renderer.domElement);

    // Lights
    three.scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(0, 5, 5);
    three.scene.add(dirLight);

    // Reticle
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    ring.matrixAutoUpdate = false;
    ring.visible = false;
    three.scene.add(ring);
    reticleRef.current = ring;

    // AR Button
    const arButton = ARButton.createButton(three.renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: overlayRef.current },
    });

    container.appendChild(arButton);

    // Controller
    three.controller = three.renderer.xr.getController(0);
    three.controller.addEventListener("select", placeModel);
    three.scene.add(three.controller);

    three.renderer.setAnimationLoop(render);

    three.renderer.xr.addEventListener("sessionstart", () => {
      console.log("AR session started");
    });

    return cleanup;
  }, []);

  /* ------------------ Hit Test ------------------ */

  async function initHitTest() {
    const session = three.renderer.xr.getSession();
    const viewerSpace = await session.requestReferenceSpace("viewer");
    three.localSpace = await session.requestReferenceSpace("local");
    three.hitTestSource = await session.requestHitTestSource({
      space: viewerSpace,
    });
  }

  function render(_, frame) {
    if (!frame) return;

    if (!three.hitTestSource) {
      initHitTest();
      return;
    }

    const hits = frame.getHitTestResults(three.hitTestSource);
    if (hits.length) {
      const pose = hits[0].getPose(three.localSpace);
      reticleRef.current.visible = true;
      reticleRef.current.matrix.fromArray(pose.transform.matrix);
    } else {
      reticleRef.current.visible = false;
    }

    three.renderer.render(three.scene, three.camera);
  }

  /* ------------------ Place Model ------------------ */

  function placeModel() {
    if (!reticleRef.current.visible || three.placed || !modelRef.current)
      return;

    modelRef.current.position.setFromMatrixPosition(reticleRef.current.matrix);
    modelRef.current.quaternion.setFromRotationMatrix(
      reticleRef.current.matrix
    );
    modelRef.current.visible = true;

    three.placed = true;
    reticleRef.current.visible = false;
  }

  /* ------------------ Load Model ------------------ */

  useEffect(() => {
    if (!three.scene) return;

    if (modelRef.current) {
      three.scene.remove(modelRef.current);
    }

    setLoaded(false);

    loader.load(modelSRCState, (gltf) => {
      const model = gltf.scene;
      model.scale.set(1, 1, 1);
      model.visible = false;

      model.traverse((m) => {
        if (m.isMesh) m.material.side = THREE.DoubleSide;
      });

      three.scene.add(model);
      modelRef.current = model;
      three.placed = false;

      setLoaded(true);
    });
  }, [modelSRCState]);

  /* ------------------ Pinch to Scale ------------------ */

  useEffect(() => {
    const overlay = overlayRef.current;

    const onTouchStart = (e) => {
      if (e.touches.length === 2 && modelRef.current?.visible) {
        pinchData.current.isPinching = true;
        pinchData.current.startDistance = getDistance(
          e.touches[0],
          e.touches[1]
        );
        pinchData.current.startScale.copy(modelRef.current.scale);
      }
    };

    const onTouchMove = (e) => {
      if (!pinchData.current.isPinching) return;

      const d = getDistance(e.touches[0], e.touches[1]);
      const scale = d / pinchData.current.startDistance;

      const newScale = pinchData.current.startScale
        .clone()
        .multiplyScalar(scale);
      newScale.clampScalar(0.1, 3);

      modelRef.current.scale.copy(newScale);
    };

    const onTouchEnd = () => (pinchData.current.isPinching = false);

    overlay.addEventListener("touchstart", onTouchStart);
    overlay.addEventListener("touchmove", onTouchMove);
    overlay.addEventListener("touchend", onTouchEnd);

    return () => {
      overlay.removeEventListener("touchstart", onTouchStart);
      overlay.removeEventListener("touchmove", onTouchMove);
      overlay.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  /* ------------------ Cleanup ------------------ */

  function cleanup() {
    three.renderer?.setAnimationLoop(null);
    three.renderer?.dispose();
  }

  /* ------------------ Model change ------------------ */
  useEffect(() => {
    if (modelSRCState === "/models/new_appartment-v1.glb") {
      setModelName("model_1");
    } else if (modelSRCState === "/models/appartment_final-v1.glb") {
      setModelName("model_2");
    } else if (modelSRCState === "/models/appartment_3-v1.glb") {
      setModelName("model_3");
    }
  }, [modelSRCState]);

  const setModelSRC = (src) => {
    // This function can be used to change the modelSRC from BottomNav
    console.log("Setting model SRC to:", src);
    setModelSRCState(src);
  };

  /* ------------------ toggle hotspots ------------------ */
  const toggleHotspotsOverlay = (b) => {
    setAreHotspotsVisible(b);
  };

  /* ------------------ UI ------------------ */

  return (
    <>
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
      <div ref={overlayRef} style={{ position: "absolute", inset: 0 }}>
        <ToggleSwitch isEnabled={toggleHotspotsOverlay} />
        {!loaded && <Loader />}
        {areHotspotsVisible && <Hotspots />}
        <BottomNav active={modelName} setModelSRC={setModelSRC} />
      </div>
    </>
  );
}
