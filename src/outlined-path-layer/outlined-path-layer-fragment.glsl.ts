// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export default `\
#version 300 es
#define SHADER_NAME outpath-layer-fragment-shader

precision highp float;

in vec4 vColorInner;
in vec4 vColorOutline;
in float vWidthRatio;
in vec2 vCornerOffset;
in float vMiterLength;
in vec2 vPathPosition;
in float vPathLength;
in float vJointType;
in float vIsCap; 

out vec4 fragColor;

void main(void) {
  geometry.uv = vPathPosition;

  bool isCapOrJoint = vPathPosition.y < 0.0 || vPathPosition.y > vPathLength;
  bool isRound = vJointType > 0.5;

  // --- Block 1: Robust Geometry Clipping ---
  // This part remains as-is with branching. It is more robust against
  // floating-point errors that can cause gaps in the geometry.
  if (isCapOrJoint) {
    if (isRound) { 
        if (length(vCornerOffset) > 1.0) discard;
    } else { 
        if (vMiterLength > path.miterLimit + 1.0) discard;
    }
  }
  // --- Block 2: Optimized Branchless Coloring ---
  // The rest of the shader is refactored to avoid 'if/else' for better performance.
  
  // 1. Calculate distance from path center using mix()
  // float isRoundJointArea = float(isRound && isCapOrJoint);
  // float roundDist = length(vCornerOffset);
  // float straightDist = abs(vPathPosition.x);
  float dist = mix(abs(vPathPosition.x), length(vCornerOffset), float(isRound && isCapOrJoint));

  // 2. Determine base color (inner vs. outline) using step() and mix()
  vec4 baseColor = mix(vColorInner, vColorOutline, step(vWidthRatio, dist));

  // 3. Handle the special case for square caps without a branch
  float isSquareCap = float(vIsCap > 0.5 && isCapOrJoint && !isRound);
  
  // If it's a square cap, mix toward the outline color. Otherwise, keep the base color.
  fragColor = mix(baseColor, vColorOutline, isSquareCap);
  
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;
