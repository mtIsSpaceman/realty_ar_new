// src/components/ARScene.js
import React, { useEffect, useState, useRef } from "react";
import "../App.css";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import ProgressBar from "./ProgressBar";

const ARScene = ({modelSRC}) => {
  window.THREE = THREE;

  const arVContainerRef = useRef();
  const arToolkitSourceRef = useRef();
  const gltfLoader = new GLTFLoader();
    const [progress, setProgress] = useState(0);
    const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadModel = (group, loader) => {
      // Load a glTF resource
      loader.load(
        // resource URL
        //"/models/building_joined-v1_scaled.glb",
        //"/models/appartment_final.glb",
        //"/models/new_appartment.glb",
        modelSRC,
        // called when the resource is loaded
        function (gltf) {
          setLoaded(true); // model fully loaded
          gltf.scene.scale.set(5, 5, 5);
          group.add(gltf.scene);
        },
        // called while loading is progressing
        function (xhr) {
          if (xhr.total) {
          const percent = (xhr.loaded / xhr.total) * 100;
          setProgress(percent);
        }
          console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        },
        // called when loading has errors
        function (error) {
          console.log("An error happened");
        }
      );
    };

    const initAR = () => {
      let scene, camera, renderer;
      let arToolkitSource, arToolkitContext;
      let markerRoot1, markerControls1;
      const patternURL = "/markers/hiro/pattern-Pattern-hiro.patt"; // Adjust the path as needed

      const sourceWidth = 640 * 2;
      const sourceHeight = 480 * 2;

      // === Initialize scene ===
      arVContainerRef.current.style.width = window.innerWidth;
      arVContainerRef.current.style.height = window.innerHeight;

      scene = new THREE.Scene();

      let ambientLight = new THREE.AmbientLight(0xcccccc, 2);
      scene.add(ambientLight);

      camera = new THREE.Camera();
      scene.add(camera);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        logarithmicDepthBuffer: true,
      });
      renderer.setClearColor(new THREE.Color("lightgrey"), 0);
      renderer.setSize(
        arVContainerRef.current.clientWidth,
        arVContainerRef.current.clientHeight
      );
      renderer.setPixelRatio(1);

      renderer.domElement.style.zIndex = "5";
      renderer.domElement.setAttribute("id", "threejs-scene");
      arVContainerRef.current.appendChild(renderer.domElement);

      ////////////////////////////////////////////////////////////
      // setup arToolkitSource
      ////////////////////////////////////////////////////////////

      arToolkitSourceRef.current = new THREEx.ArToolkitSource({
        sourceType: "webcam",

        sourceWidth: sourceWidth.toString(),
        sourceHeight: sourceHeight.toString(),
        // displayWidth: sourceWidth.toString(),
        // displayHeight: sourceHeight.toString(),
      });

      //console.log(arToolkitSource);

      function onResize() {
        //arToolkitSourceRef.current.onResize();
        //arToolkitSourceRef.current.copySizeTo(renderer.domElement);
        if (arToolkitContext.arController !== null) {
          arToolkitSourceRef.current.copySizeTo(
            arToolkitContext.arController.canvas
          );
        }
      }

      arToolkitSourceRef.current.init(function onReady() {
        onResize();
        //arVContainerRef.current.appendChild(arToolkitSourceRef.current.domElement);
        arToolkitSourceRef.current.domElement.setAttribute(
          "id",
          "video_source"
        );

        console.log(arToolkitSourceRef.current);
        renderer.setSize(sourceWidth, sourceHeight);
      });

      // handle resize event
      window.addEventListener("resize", function () {
        onResize();
      });

      ////////////////////////////////////////////////////////////
      // setup arToolkitContext
      ////////////////////////////////////////////////////////////

      // create atToolkitContext
      arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: "/camera_para.dat",
        detectionMode: "mono", //'color_and_matrix',
        // Pattern ratio for custom markers
        patternRatio: 0.6,
        // black_region: Black bordered markers on a white background, white_region: White bordered markers on a black background
        labelingMode: "black_region",
        // tune the maximum rate of pose detection in the source image
        maxDetectionRate: 120,

        imageSmoothingEnabled: true,
      });

      // copy projection matrix to camera when initialization complete
      arToolkitContext.init(function onCompleted() {
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
      });

      ////////////////////////////////////////////////////////////
      // setup markerRoots
      ////////////////////////////////////////////////////////////

      // build markerControls
      markerRoot1 = new THREE.Group();
      loadModel(markerRoot1, gltfLoader);
      // === Add Cube ===
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshNormalMaterial({
        transparent: true,
        opacity: 0.5,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.y = 0.5;
      //markerRoot1.add(cube);
      // === Add Marker Controls ===
      scene.add(markerRoot1);

      markerControls1 = new THREEx.ArMarkerControls(
        arToolkitContext,
        markerRoot1,
        {
          type: "pattern",
          patternUrl: patternURL,
          // type : 'nft',
          // descriptorsUrl : 'public/nft',
          changeMatrixMode: "modelViewMatrix",
          smooth: true,
          // number of matrices to smooth tracking over, more = smoother but slower follow
          smoothCount: 100,
          // distance tolerance for smoothing, if smoothThreshold # of matrices are under tolerance, tracking will stay still
          smoothTolerance: 100,
          // threshold for smoothing, will keep still unless enough matrices are over tolerance
          smoothThreshold: 50,
        }
      );
      // === Render Loop ===
      const clock = new THREE.Clock();
      const animate = () => {
        requestAnimationFrame(animate);

        if (arToolkitSourceRef.current.ready === false) return;

        arToolkitContext.update(arToolkitSourceRef.current.domElement);
        renderer.render(scene, camera);
      };

      animate();
    };
    initAR();

    // return () => {
    //   arVContainerRef.current.removeChild(renderer.domElement);
    // };
  }, []);

  useEffect(() => {
    let isMounted = true;

    arToolkitSourceRef.current.init(() => {
      if (isMounted && arVContainerRef.current) {
        arVContainerRef.current.appendChild(
          arToolkitSourceRef.current.domElement
        );
      }
    });

    return () => {
      isMounted = false;
      if (arVContainerRef.current) {
        arVContainerRef.current.innerHTML = ""; // clean up canvases/videos
      }
    };
  }, []);

  return (
    <div
      ref={arVContainerRef}
      id="arVContainerRef"
      style={{ width: "100%", height: "100%" }}
    >
            {!loaded && <ProgressBar progress={progress} />}
    </div>
  );
};

export default ARScene;
