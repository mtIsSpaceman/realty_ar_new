import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import BottomNav from "../components/BottomNav";
import ToggleSwitch from "../components/ToggleSwitch";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

export default function ViewerAR(modelSRC) {
  const navigate = useNavigate();

  const [modelSRCState, setModelSRCState] = useState(modelSRC);
  const [modelName, setModelName] = useState("model_1");
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const mountRef = useRef(null); // Ref for the container div where renderer attaches
  const overlayRef = useRef(null); // Ref for the overlay div
  const videoRef = useRef(null); // Ref for the video element
  const lookForSurfaceIconRef = useRef(null);
  const closeArButtonRef = useRef(null);
  const middlePartRef = useRef(null); // Ref for AR button container
  const modelRef = useRef();

  // Refs to store Three.js objects and mutable state without causing re-renders
  const threeStuff = useRef({
    camera: null,
    scene: null,
    renderer: null,
    controller: null,
    session: null,
    localSpace: null,
    hitTestSource: null,
    reticle: null,
    front_scene: null,
    frontFrame: null,
    frontFrameShadow: null,
    isXRSessionStarted: false,
    is_front_scene_placed: false,
    hitSomething: false,
    hitTestSourceInitialized: false,
    isPinching: false,
    startingDistance_pinch: null,
    initialScale: new THREE.Vector3(),
    animationFrameId: null,
    launchArScript: null,
    arButtonElement: null,
  }).current; // .current gives us the mutable object

  const plane_size_multiplier = 1; // Keep constants like this accessible

  // Load LaunchAR SDK Dynamically
  // <script src="https://launchar.app/sdk/v1?key=JdjA4xH5g9SkyBLC8Qd0eY4GI6AMiV2x&redirect=true"></script>
  useEffect(() => {
    const launchArKey = "JdjA4xH5g9SkyBLC8Qd0eY4GI6AMiV2x"; // Replace with your actual key if different
    const scriptId = "launchar-sdk-script";

    // Check if script already exists
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://launchar.app/sdk/v1?key=${launchArKey}&redirect=true`;
      script.async = true;
      document.head.appendChild(script);
      threeStuff.launchArScript = script; // Store ref to remove later
    }

    // Cleanup function to remove the script when component unmounts
    return () => {
      if (threeStuff.launchArScript && threeStuff.launchArScript.parentNode) {
        threeStuff.launchArScript.parentNode.removeChild(
          threeStuff.launchArScript
        );
        threeStuff.launchArScript = null; // Clear the ref
      }
    };
  }, [threeStuff]); // Empty dependency array ensures this runs once on mount/unmount

  // Main Three.js/WebXR initialization and animation loop effect
  useEffect(() => {
    // --- Check for WebXR support ---
    // Note: This check might run before the ARButton is created. The ARButton itself
    // often handles displaying messages if WebXR is not supported. The original
    // code redirected to /qr, which might need different handling in a React SPA context.
    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then((isSupported) => {
        if (!isSupported) {
          console.warn("Immersive AR not supported on this device.");
          // Handle lack of support - maybe display a message or redirect.
          // Example: window.location.href = '/qr'; // (Consider React Router for navigation)
        }
      });
    } else {
      console.warn("WebXR API not available in this browser.");
      // Handle lack of WebXR API
    }

    // --- Utility Functions (adapted from original script) ---
    function getDistance(touch1, touch2) {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    // --- Event Handlers (defined within useEffect scope) ---
    const onTouchStart = (event) => {
      if (
        !threeStuff.is_front_scene_placed ||
        !threeStuff.renderer?.xr.isPresenting
      )
        return;
      // event.preventDefault(); // Consider uncommenting if needed

      if (event.touches.length === 2) {
        threeStuff.isPinching = true;
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        threeStuff.startingDistance_pinch = getDistance(touch1, touch2);
        if (threeStuff.front_scene) {
          threeStuff.initialScale.copy(threeStuff.front_scene.scale);
        }
      } else if (event.touches.length === 1) {
        threeStuff.isPinching = false;
      }
    };

    const onTouchMove = (event) => {
      if (
        !threeStuff.is_front_scene_placed ||
        !threeStuff.isPinching ||
        event.touches.length !== 2 ||
        !threeStuff.renderer?.xr.isPresenting
      ) {
        if (threeStuff.isPinching && event.touches.length !== 2) {
          threeStuff.isPinching = false;
          threeStuff.startingDistance_pinch = null;
        }
        return;
      }
      // event.preventDefault(); // Consider uncommenting if needed

      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = getDistance(touch1, touch2);

      if (threeStuff.startingDistance_pinch > 0 && threeStuff.front_scene) {
        const scaleFactor = currentDistance / threeStuff.startingDistance_pinch;
        const targetScale = threeStuff.initialScale
          .clone()
          .multiplyScalar(scaleFactor);

        const minScale = 0.1; // Prevent scaling down too much
        const maxScale = 2.5;
        targetScale.clampScalar(minScale, maxScale);

        threeStuff.front_scene.scale.copy(targetScale);
      }
    };

    const onTouchEnd = (event) => {
      if (
        !threeStuff.is_front_scene_placed ||
        !threeStuff.renderer?.xr.isPresenting
      )
        return;
      // event.preventDefault(); // Consider uncommenting if needed

      if (threeStuff.isPinching && event.touches.length < 2) {
        threeStuff.isPinching = false;
        threeStuff.startingDistance_pinch = null;
        // Keep the final scale
      }
    };

    const initializeHitTestSource = async () => {
      threeStuff.session = threeStuff.renderer.xr.getSession();
      if (!threeStuff.session) return; // Guard against missing session

      try {
        const viewerSpace = await threeStuff.session.requestReferenceSpace(
          "viewer"
        );
        threeStuff.localSpace = await threeStuff.session.requestReferenceSpace(
          "local"
        );

        threeStuff.hitTestSource =
          await threeStuff.session.requestHitTestSource({
            space: viewerSpace,
          });

        threeStuff.hitTestSourceInitialized = true;

        // Session Start/End Listeners
        const onSessionStart = () => {
          console.log("XR session has started");
          threeStuff.isXRSessionStarted = true;
          // Initial UI state can be set here if needed
          if (lookForSurfaceIconRef.current) {
            lookForSurfaceIconRef.current.style.visibility = "visible"; // Show initially
          }
          if (closeArButtonRef.current) {
            closeArButtonRef.current.style.visibility = "visible";
          }
        };

        const onSessionEnd = () => {
          console.log("XR session has ended");
          threeStuff.isXRSessionStarted = false;
          threeStuff.is_front_scene_placed = false;
          threeStuff.hitSomething = false;
          threeStuff.hitTestSourceInitialized = false;
          threeStuff.hitTestSource = null;
          threeStuff.localSpace = null; // Reset local space
          threeStuff.session = null; // Reset session

          if (videoRef.current) videoRef.current.pause();
          if (threeStuff.front_scene) threeStuff.front_scene.visible = false;
          if (threeStuff.reticle) threeStuff.reticle.visible = false; // Hide reticle on end

          // Reset UI
          if (lookForSurfaceIconRef.current) {
            lookForSurfaceIconRef.current.style.visibility = "hidden";
          }
          if (closeArButtonRef.current) {
            closeArButtonRef.current.style.visibility = "hidden";
          }

          // Optionally force a reload or navigate back if AR session end means exiting the feature
          // window.location.reload(); // As in original, but consider React Router
        };

        threeStuff.session.addEventListener("start", onSessionStart);
        threeStuff.session.addEventListener("end", onSessionEnd);

        // Store listeners for cleanup
        threeStuff.sessionStartListener = onSessionStart;
        threeStuff.sessionEndListener = onSessionEnd;
      } catch (error) {
        console.error("Failed to initialize hit test source:", error);
        threeStuff.hitTestSourceInitialized = false;
      }
    };

    const checkIfReticleIsHorizontal = () => {
      if (
        threeStuff.reticle &&
        threeStuff.reticle.parent === threeStuff.scene
      ) {
        const rotationMatrix = new THREE.Matrix4().extractRotation(
          threeStuff.reticle.matrix
        );
        const euler = new THREE.Euler().setFromRotationMatrix(rotationMatrix);
        // Increased tolerance slightly as perfectly horizontal might be rare
        const isHorizontal = Math.abs(euler.x) < Math.PI / 90; // ~2 degrees tolerance
        //console.log("Is Horizontal:", isHorizontal, "Euler X:", euler.x);
        return isHorizontal;
      }
      return false;
    };

    const onSelect = () => {
      if (
        threeStuff.hitSomething &&
        threeStuff.reticle &&
        threeStuff.reticle.visible && // Check if reticle is visible
        threeStuff.front_scene &&
        !threeStuff.front_scene.visible && // Check if scene exists but isn't placed
        threeStuff.front_scene.parent === threeStuff.scene
      ) {
        if (checkIfReticleIsHorizontal()) {
          threeStuff.front_scene.position.setFromMatrixPosition(
            threeStuff.reticle.matrix
          );
          threeStuff.front_scene.quaternion.setFromRotationMatrix(
            threeStuff.reticle.matrix
          );
          threeStuff.front_scene.visible = true;
          if (videoRef.current) videoRef.current.play();
          if (threeStuff.reticle) threeStuff.reticle.visible = false; // Hide reticle after placement
          threeStuff.is_front_scene_placed = true;

          // UI update after placement
          if (lookForSurfaceIconRef.current) {
            lookForSurfaceIconRef.current.style.visibility = "hidden";
          }
        } else {
          console.log("Surface not horizontal enough for placement.");
          // Optionally provide feedback to the user
        }
      } else {
        console.log(
          "Cannot place: Reticle not visible, scene already placed, or assets not ready."
        );
      }
    };

    const updateLookForSurfaceIconVisibility = () => {
      if (!lookForSurfaceIconRef.current) return;

      if (
        threeStuff.localSpace && // Only show if AR session is running
        !threeStuff.hitSomething && // Only show if not hitting a surface
        threeStuff.front_scene &&
        !threeStuff.front_scene.visible // Only show before placement
      ) {
        lookForSurfaceIconRef.current.style.visibility = "visible";
      } else {
        lookForSurfaceIconRef.current.style.visibility = "hidden";
      }
    };

    const onWindowResize = () => {
      if (threeStuff.camera && threeStuff.renderer) {
        threeStuff.camera.aspect = window.innerWidth / window.innerHeight;
        threeStuff.camera.updateProjectionMatrix();
        threeStuff.renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    // --- Initialization Function ---
    function init() {
      const container = mountRef.current; // Use the ref
      if (!container) return; // Should not happen if component mounted

      threeStuff.scene = new THREE.Scene();

      threeStuff.camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        20
      );

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Reduced intensity
      threeStuff.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0); // Reduced intensity
      directionalLight.position.set(-5, 10, -5).normalize();
      threeStuff.scene.add(directionalLight);

      // Renderer setup
      threeStuff.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      threeStuff.renderer.setPixelRatio(window.devicePixelRatio);
      threeStuff.renderer.setSize(window.innerWidth, window.innerHeight);
      threeStuff.renderer.xr.enabled = true;
      container.appendChild(threeStuff.renderer.domElement);

      // AR Button Setup
      if (middlePartRef.current && overlayRef.current) {
        // Ensure ARButton logic doesn't run multiple times if effect re-runs
        if (!threeStuff.arButtonElement) {
          threeStuff.arButtonElement = ARButton.createButton(
            threeStuff.renderer,
            {
              requiredFeatures: ["local", "hit-test"],
              optionalFeatures: ["dom-overlay"],
              domOverlay: { root: overlayRef.current }, // Use the ref for overlay
            }
          );
          middlePartRef.current.appendChild(threeStuff.arButtonElement);
        }
      } else {
        console.error("AR Button container or Overlay ref not found!");
      }

      // Controller Setup
      threeStuff.controller = threeStuff.renderer.xr.getController(0);
      threeStuff.controller.addEventListener("select", onSelect); // Attach select event
      threeStuff.scene.add(threeStuff.controller);

      // Add Touch Event Listeners to the overlay
      const overlayElement = overlayRef.current;
      if (overlayElement) {
        overlayElement.addEventListener("touchstart", onTouchStart, {
          passive: false,
        });
        overlayElement.addEventListener("touchmove", onTouchMove, {
          passive: false,
        });
        overlayElement.addEventListener("touchend", onTouchEnd, {
          passive: false,
        });
      }

      // Window Resize Listener
      window.addEventListener("resize", onWindowResize);

      // Add Reticle and Scene Objects
      addReticleToScene();
      createScene();

      // Close Button Listener
      const closeButton = closeArButtonRef.current;
      if (closeButton) {
        // Use a named function for easier removal
        const handleCloseClick = () => {
          if (threeStuff.session) {
            threeStuff.session
              .end()
              .catch((err) => console.error("Error ending session:", err));
          } else {
            // Fallback if session is somehow null but button is clicked
            window.location.reload();
          }
        };
        closeButton.addEventListener("click", handleCloseClick);
        // Store handler for removal in cleanup
        threeStuff.closeButtonHandler = handleCloseClick;
      }
    }

    // --- Scene Object Creation Functions ---
    function addReticleToScene() {
      const geometry = new THREE.RingGeometry(0.08, 0.1, 32).rotateX(
        -Math.PI / 2
      ); // Slightly smaller
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff, // White for visibility
        opacity: 0.75,
        transparent: true,
      });
      threeStuff.reticle = new THREE.Mesh(geometry, material);
      threeStuff.reticle.matrixAutoUpdate = false;
      threeStuff.reticle.visible = false;
      threeStuff.scene.add(threeStuff.reticle);

      // Optional: Add grid texture or indicator plane from original code if desired
      const grid_texture = new THREE.TextureLoader().load(
        "./assets/icons/Texture_01.png"
      ); // Make sure path is correct
      const grid_geo = new THREE.PlaneGeometry(0.2, 0.2);
      const grid_mat = new THREE.MeshBasicMaterial({
        map: grid_texture,
        transparent: true,
        side: THREE.DoubleSide,
        opacity: 0.5,
      });
      const gridMesh = new THREE.Mesh(grid_geo, grid_mat);
      gridMesh.rotation.x = -Math.PI / 2;
      gridMesh.position.y = 0.01; // Slightly above the ring
      threeStuff.reticle.add(gridMesh); // Add as child

      //Indicator plane (adjust path and logic as needed)
      const indicator_texture = new THREE.TextureLoader().load(
        "./icons/indicator_plane.png"
      );
      const indicator_plane_geo = new THREE.PlaneGeometry(
        1.125 * plane_size_multiplier * 0.15,
        2 * plane_size_multiplier * 0.15
      ); // Scaled down
      const indicator_plane_mat = new THREE.MeshBasicMaterial({
        map: indicator_texture,
        transparent: true,
        side: THREE.DoubleSide,
        opacity: 0.8,
      });
      const indicator_plane = new THREE.Mesh(
        indicator_plane_geo,
        indicator_plane_mat
      );
      indicator_plane.position.set(
        0,
        (2 * plane_size_multiplier * 0.15 * 0.9) / 3,
        0.01
      ); // Position relative to reticle
      threeStuff.reticle.add(indicator_plane);
    }

    function createScene() {
      const currentVideo = videoRef.current;
      if (!currentVideo || !threeStuff.scene) return;

      threeStuff.front_scene = new THREE.Group();
      threeStuff.front_scene.visible = false; // Start hidden

      // const videoTexture1 = new THREE.VideoTexture(currentVideo);
      // videoTexture1.needsUpdate = true; // Important for video textures

      // const geometry1 = new THREE.PlaneGeometry(
      //   1.125 * plane_size_multiplier,
      //   2 * plane_size_multiplier
      // );

      // Main video plane material
      // const chromakeyMaterial1 = new THREE.ShaderMaterial({
      //   transparent: true,
      //   uniforms: {
      //     map: { value: videoTexture1 },
      //     keyColor: { value: [0.0, 1.0, 0.0] }, // Green screen
      //     similarity: { value: 0.74 },
      //     smoothness: { value: 0.05 }, // Added slight smoothness
      //   },
      //   vertexShader: vertexShader,
      //   fragmentShader: fragmentShader,
      //   side: THREE.DoubleSide,
      //   depthWrite: false, // Often needed for transparent objects to sort correctly
      // });

      // threeStuff.frontFrame = new THREE.Mesh(geometry1, chromakeyMaterial1);
      // threeStuff.frontFrame.position.set(
      //   0,
      //   (2 * plane_size_multiplier * 0.9) / 3,
      //   0
      // ); // Position relative to group center

      // // Shadow plane material
      // const chromakeyMaterial1Shadow = new THREE.ShaderMaterial({
      //   transparent: true,
      //   uniforms: {
      //     map: { value: videoTexture1 },
      //     keyColor: { value: [0.0, 1.0, 0.0] },
      //     similarity: { value: 0.74 },
      //     smoothness: { value: 0.05 }, // Match smoothness
      //   },
      //   vertexShader: vertexShaderShadow,
      //   fragmentShader: fragmentShaderShadow,
      //   side: THREE.DoubleSide,
      //   depthWrite: false, // Shadows shouldn't write to depth buffer typically
      // });

      // const geometry1Shadow = geometry1.clone(); // Reuse geometry definition
      // threeStuff.frontFrameShadow = new THREE.Mesh(
      //   geometry1Shadow,
      //   chromakeyMaterial1Shadow
      // );
      // Position the shadow slightly below and behind the main plane, rotated flat
      // threeStuff.frontFrameShadow.position.set(0, -0.01, -0.01); // Small offset below main plane
      // threeStuff.frontFrameShadow.rotation.x = -Math.PI / 2; // Lay flat
      // Scale shadow slightly larger for effect?
      // threeStuff.frontFrameShadow.scale.set(1.05, 1.05, 1.05);

      // threeStuff.front_scene.add(threeStuff.frontFrame);
      // threeStuff.front_scene.add(threeStuff.frontFrameShadow);
      threeStuff.scene.add(threeStuff.front_scene); // Add group to the main scene
    }

    // --- Animation Loop ---
    function render(timestamp, frame) {
      // Request next frame
      threeStuff.animationFrameId = threeStuff.renderer.xr
        .getSession()
        ?.requestAnimationFrame(render);

      if (frame && threeStuff.renderer.xr.isPresenting) {
        // --- Hit Testing ---
        if (!threeStuff.hitTestSourceInitialized) {
          initializeHitTestSource(); // Initialize on first frame
        }

        if (
          threeStuff.hitTestSourceInitialized &&
          threeStuff.hitTestSource &&
          threeStuff.localSpace &&
          threeStuff.reticle
        ) {
          const hitTestResults = frame.getHitTestResults(
            threeStuff.hitTestSource
          );

          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(threeStuff.localSpace);
            if (pose) {
              threeStuff.reticle.visible = true;
              threeStuff.reticle.matrix.fromArray(pose.transform.matrix);
              threeStuff.hitSomething = true;
            } else {
              threeStuff.reticle.visible = false;
              threeStuff.hitSomething = false;
            }
          } else {
            threeStuff.reticle.visible = false;
            threeStuff.hitSomething = false;
          }
        } else if (threeStuff.reticle) {
          threeStuff.reticle.visible = false; // Hide if no hit test source
          threeStuff.hitSomething = false;
        }

        // Update UI based on hit state (only before placement)
        if (!threeStuff.is_front_scene_placed) {
          updateLookForSurfaceIconVisibility();
        }
      } else if (threeStuff.reticle) {
        // Hide reticle if not presenting AR
        threeStuff.reticle.visible = false;
        threeStuff.hitSomething = false;
      }

      // Update video texture if playing
      if (
        videoRef.current &&
        !videoRef.current.paused &&
        threeStuff.frontFrame?.material.uniforms.map.value
      ) {
        threeStuff.frontFrame.material.uniforms.map.value.needsUpdate = true;
        if (threeStuff.frontFrameShadow?.material.uniforms.map.value) {
          threeStuff.frontFrameShadow.material.uniforms.map.value.needsUpdate = true;
        }
      }

      // Render the scene
      if (threeStuff.renderer && threeStuff.scene && threeStuff.camera) {
        threeStuff.renderer.render(threeStuff.scene, threeStuff.camera);
      }
    }

    // --- Start Initialization and Animation ---
    init(); // Initialize Three.js scene, renderer, etc.
    threeStuff.renderer.setAnimationLoop(render); // Start the render loop

    // --- Cleanup Function ---
    return () => {
      console.log("Cleaning up Three.js/WebXR resources...");

      // Stop animation loop
      if (threeStuff.renderer) {
        threeStuff.renderer.setAnimationLoop(null);
      }
      if (threeStuff.animationFrameId) {
        // Although setAnimationLoop(null) should handle it, being explicit can't hurt
        const sessionForCancel = threeStuff.renderer?.xr.getSession();
        if (sessionForCancel) {
          sessionForCancel.cancelAnimationFrame(threeStuff.animationFrameId);
        }
      }

      // End XR session if active
      const currentSession = threeStuff.renderer?.xr.getSession();
      if (currentSession) {
        // Remove session listeners first to prevent them firing during cleanup
        if (threeStuff.sessionStartListener)
          currentSession.removeEventListener(
            "start",
            threeStuff.sessionStartListener
          );
        if (threeStuff.sessionEndListener)
          currentSession.removeEventListener(
            "end",
            threeStuff.sessionEndListener
          );

        currentSession
          .end()
          .catch((err) =>
            console.error("Error ending session during cleanup:", err)
          );
      }
      threeStuff.session = null; // Clear session ref

      // Remove event listeners
      window.removeEventListener("resize", onWindowResize);
      if (threeStuff.controller) {
        threeStuff.controller.removeEventListener("select", onSelect);
      }
      const overlayElement = overlayRef.current;
      if (overlayElement) {
        overlayElement.removeEventListener("touchstart", onTouchStart);
        overlayElement.removeEventListener("touchmove", onTouchMove);
        overlayElement.removeEventListener("touchend", onTouchEnd);
      }
      const closeButton = closeArButtonRef.current;
      if (closeButton && threeStuff.closeButtonHandler) {
        closeButton.removeEventListener("click", threeStuff.closeButtonHandler);
        threeStuff.closeButtonHandler = null;
      }

      // Dispose of Three.js objects
      if (threeStuff.scene) {
        threeStuff.scene.traverse((object) => {
          if (object.geometry) {
            object.geometry.dispose();
            // console.log("Disposed geometry for:", object.name || object.type);
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => {
                if (material.map) material.map.dispose();
                material.dispose();
              });
            } else {
              if (object.material.map) object.material.map.dispose(); // Dispose textures
              object.material.dispose();
            }
            // console.log("Disposed material(s) for:", object.name || object.type);
          }
        });
        threeStuff.scene = null; // Clear scene ref
      }

      // Dispose renderer and remove from DOM
      if (threeStuff.renderer) {
        if (
          threeStuff.renderer.domElement &&
          threeStuff.renderer.domElement.parentNode
        ) {
          threeStuff.renderer.domElement.parentNode.removeChild(
            threeStuff.renderer.domElement
          );
        }
        threeStuff.renderer.dispose();
        threeStuff.renderer = null; // Clear renderer ref
      }

      // Remove AR Button if it was added
      if (threeStuff.arButtonElement && threeStuff.arButtonElement.parentNode) {
        threeStuff.arButtonElement.parentNode.removeChild(
          threeStuff.arButtonElement
        );
        threeStuff.arButtonElement = null;
      }

      // Pause video
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = ""; // Detach source
        videoRef.current.load(); // Reset video element
      }

      console.log("Cleanup complete.");
    };
  }, [threeStuff]); // Add dependencies that, if changed, should trigger re-initialization. `threeStuff` is stable ref object.

  useEffect(() => {
    if (!mountRef.current) return;

    setLoaded(false);
    setProgress(0);

    // make sure markerRoot1Ref.current exists in your initAR
    if (!threeStuff.front_scene) return;

    // cleanup old models
    while (threeStuff.front_scene.children.length > 0) {
      threeStuff.front_scene.remove(threeStuff.front_scene.children[0]);
    }

    // load new model
    gltfLoader.load(
      modelSRCState,
      (gltf) => {
        // Clean old model
        if (modelRef.current) {
          threeStuff.front_scene.remove(modelRef.current);
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

        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.material.side = THREE.DoubleSide;
          }
        });

        setLoaded(true);
        gltf.scene.scale.set(5, 5, 5);
        threeStuff.front_scene.add(gltf.scene);
        modelRef.current = gltf.scene;
      },
      (xhr) => {
        if (xhr.total) {
          const percent = (xhr.loaded / xhr.total) * 100;
          setProgress(percent);
        }
      },
      (err) => console.error("Error loading model:", err)
    );
  }, [modelSRCState]);

  useEffect(() => {
    if (modelSRCState === "/models/new_appartment.glb") {
      setModelName("model_1");
    } else if (modelSRCState === "/models/appartment_final.glb") {
      setModelName("model_2");
    } else if (modelSRCState === "/models/appartment_3.glb") {
      setModelName("model_3");
    }
  }, [modelSRCState]);

  const setModelSRC = (src) => {
    // This function can be used to change the modelSRC from BottomNav
    console.log("Setting model SRC to:", src);
    setModelSRCState(src);
  };

  return (
    <>
      <div
        ref={mountRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
      ></div>
      {/* Overlay for AR UI Elements */}
      <div
        id="overlay"
        ref={overlayRef}
        style={{
          zIndex: 3,
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <div
          id="look_for_surface_icon"
          ref={lookForSurfaceIconRef}
          style={{
            visibility: "hidden",
            pointerEvents: "none" /* Icon itself isn't interactive */,
          }}
        ></div>
        <ToggleSwitch />
        {!loaded && <Loader />}

        <BottomNav active={modelName} setModelSRC={setModelSRC} />
      </div>
      <div ref={middlePartRef}></div>
    </>
  );
}
