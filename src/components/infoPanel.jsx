import React, { useState, useRef, useEffect } from "react";
import { forwardRef, useImperativeHandle } from "react";
import { Vector3 } from "three";

export const InfoPanel = forwardRef((props, ref) => {

  return <div ref={ref} className="info_panel"></div>;
});
