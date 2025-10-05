// src/components/ARScene.js
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ARScene = () => {
  const containerRef = useRef();

  useEffect(() => {
    const container = containerRef.current;

    // scene, camera, renderer setup...
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    const controls = new OrbitControls( camera, renderer.domElement );

    // CSS2DRenderer setup
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";
    labelRenderer.domElement.style.pointerEvents = "none";
    container.appendChild(labelRenderer.domElement);

    // Example 3D object
    const geometry = new THREE.SphereGeometry(0.2, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const geometry2 = new THREE.SphereGeometry(0.2, 32, 32);
    const material2 = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const sphere2 = new THREE.Mesh(geometry2, material2);
    sphere2.position.set(1,0,0);
    scene.add(sphere2);

    // Info Panel (fixed in viewport)
    const infoPanel = document.createElement("div");
    infoPanel.className = "info-panel";
    infoPanel.textContent = "This is my tooltip!";
    Object.assign(infoPanel.style, {
      position: "absolute",
      right: "20px",
      top: "50%",
      padding: "10px",
      background: "rgba(0,0,0,0.7)",
      color: "white",
      borderRadius: "8px",
      transform: "translateY(-50%)",
    });
    container.appendChild(infoPanel);

    // Pointer Line (CSS element)
    const pointer = document.createElement("div");
    Object.assign(pointer.style, {
      position: "absolute",
      width: "100px",
      backgroundImage: 'url("/svg/svgviewer-output.svg")',
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundSize: "100% 100%"
    });
    container.appendChild(pointer);

    // Project function: get screen coords of 3D object
    function getScreenPosition(obj, camera) {
      const vector = new THREE.Vector3();
      vector.copy(obj.position).project(camera);

      return {
        x: (vector.x * 0.5 + 0.5) * window.innerWidth,
        y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
      };
    }

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      

      renderer.render(scene, camera);
      //labelRenderer.render(scene, camera);

     

      // get 2D coords of sphere
      const screenPos = getScreenPosition(sphere, camera);

      // fixed panel position
      const panelRect = infoPanel.getBoundingClientRect();
      const panelX = panelRect.left;
      const panelY = panelRect.top + panelRect.height / 2;

      console.log(screenPos);

      // calculate line position/rotation
      const dx = screenPos.x - panelX;
      const dy = screenPos.y - panelY;
      const length = Math.sqrt(dx * dx + dy * dy);

      pointer.style.left = panelX + "px";
      pointer.style.top = panelY + "px";
      pointer.style.height = length + "px";
      pointer.style.transformOrigin = "50% 0%";
      pointer.style.transform = `translate(-50px, 0) rotate(${Math.atan2(dy, dx)- Math.PI/2}rad)`;

      sphere.rotation.y += 0.01;

      controls.update();
    }

    animate();

    // ✅ Cleanup on unmount
    return () => {
      container.removeChild(renderer.domElement);
      container.removeChild(labelRenderer.domElement);
      container.removeChild(infoPanel);
      container.removeChild(pointer);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100vh", position: "relative" }} />;
};

export default ARScene;
