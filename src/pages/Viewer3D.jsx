import React, { useEffect, useRef, useState } from "react";
//
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
//
import BottomNav from "../components/BottomNav";
import ToggleSwitch from "../components/ToggleSwitch";
import Loader from "../components/Loader";

export default function Viewer3D({ modelSRC }) {

   const mVContainerRef = useRef();

  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();
  const modelRef = useRef();

  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // === Initialize scene/camera/renderer ONCE ===
  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      mVContainerRef.current.clientWidth / mVContainerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true, });
    renderer.setSize(
      mVContainerRef.current.clientWidth,
      mVContainerRef.current.clientHeight
    );
    mVContainerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handling
    const handleResize = () => {
      camera.aspect =
        mVContainerRef.current.clientWidth /
        mVContainerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        mVContainerRef.current.clientWidth,
        mVContainerRef.current.clientHeight
      );
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (rendererRef.current) rendererRef.current.dispose();
      if (mVContainerRef.current && renderer.domElement) {
        mVContainerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // === Load model WHENEVER modelSRC changes ===
  useEffect(() => {
    if (!sceneRef.current) return;

    const loader = new GLTFLoader();

    // Reset states
    setProgress(0);
    setLoaded(false);

    loader.load(
      modelSRC,
      (gltf) => {
        // Clean old model
        if (modelRef.current) {
          sceneRef.current.remove(modelRef.current);
          modelRef.current.traverse((child) => {
            if (child.isMesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        }

        // Add new model
        gltf.scene.scale.set(5, 5, 5);
        sceneRef.current.add(gltf.scene);
        modelRef.current = gltf.scene;

        setLoaded(true);
      },
      (xhr) => {
        if (xhr.total) {
          const percent = (xhr.loaded / xhr.total) * 100;
          setProgress(percent);
        }
      },
      (error) => console.error(error)
    );
  }, [modelSRC]);

  return (
    <div ref={mVContainerRef} className="flex flex-col justify-between h-screen bg-gray-200 w-[100%]">
      <ToggleSwitch />
      {!loaded && 
      <Loader/>
      }
      
      <BottomNav active="3d" />
    </div>
  );
}
