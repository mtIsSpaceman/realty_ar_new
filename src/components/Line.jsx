import React, { useState, useRef, useEffect } from "react";
import { forwardRef, useImperativeHandle } from "react";
import { Vector3 } from "three";

// export default function InfoPanel() {
export const Line = forwardRef(({ pos, camera, ele }, ref) => {

    console.log(ele);
    
  const pointerLineRef = useRef(null);
  const infoPanelRef = useRef(null);

  // Project function: get screen coords of 3D object
  function getScreenPosition(pos, camera) {
    const vector = new Vector3();
    vector.copy(pos).project(camera);

    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  function updateLine() {

    if (!pointerLineRef.current || !ele || !camera || !pos) return;
    // get 2D coords of object
    const screenPos = getScreenPosition(pos, camera);

    // UI panel position
    const panelRect = ele.getBoundingClientRect();
    const panelX = panelRect.left + panelRect.width / 2 + 40;
    const panelY = panelRect.top ; //+ panelRect.height / 2

    // calculate line position/rotation
    const dx = screenPos.x - panelX;
    const dy = screenPos.y - panelY;
    const length = Math.sqrt(dx * dx + dy * dy);

    pointerLineRef.current.style.left = panelX + "px";
    pointerLineRef.current.style.top = panelY + "px";
    pointerLineRef.current.style.height = length + "px";
    pointerLineRef.current.style.transformOrigin = "50% 0%";
    pointerLineRef.current.style.transform = `translate(-50px, 0) rotate(${
      Math.atan2(dy, dx) - Math.PI / 2
    }rad)`;
  }

  useImperativeHandle(ref, () => ({
    update: updateLine,
  }));

  return (
    <>
      <div ref={pointerLineRef} className="pointer_line"></div>
    </>
  );
});
