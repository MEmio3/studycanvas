/**
 * Edge path calculation utilities for the visual node graph.
 */

/**
 * Calculates a cubic bezier curve path between two points.
 * Handles left-to-right flow, but curves gracefully if target is behind source.
 */
export function calculateBezierPath(sourceX, sourceY, targetX, targetY) {
  // Base control point distance
  const dx = Math.abs(targetX - sourceX);
  // Give it a minimum control point length of 100 for smooth curves, 
  // but scale it up slightly if the nodes are far apart.
  const curvature = Math.max(100, dx * 0.4);
  
  let sourceCpX, sourceCpY, targetCpX, targetCpY;
  
  if (targetX >= sourceX - 40) {
    // Normal forward connection
    sourceCpX = sourceX + curvature;
    sourceCpY = sourceY;
    targetCpX = targetX - curvature;
    targetCpY = targetY;
  } else {
    // Backwards connection: target is behind source.
    // We want the edge to loop around, either above or below.
    sourceCpX = sourceX + curvature;
    sourceCpY = sourceY;
    targetCpX = targetX - curvature;
    targetCpY = targetY;
    
    // Determine loop direction (up or down)
    const dy = targetY - sourceY;
    const verticalOffset = Math.max(80, Math.abs(dy) * 0.5 + 40);
    const sign = dy >= 0 ? 1 : -1;
    
    // Bend the control points vertically
    sourceCpY += verticalOffset * sign;
    targetCpY += verticalOffset * sign;
  }
  
  return `M ${sourceX} ${sourceY} C ${sourceCpX} ${sourceCpY}, ${targetCpX} ${targetCpY}, ${targetX} ${targetY}`;
}

/**
 * Gets the midpoint of a cubic bezier curve using B(t) where t=0.5
 */
export function getBezierMidpoint(sourceX, sourceY, targetX, targetY) {
  const dx = Math.abs(targetX - sourceX);
  const curvature = Math.max(100, dx * 0.4);
  
  let sourceCpX, sourceCpY, targetCpX, targetCpY;
  
  if (targetX >= sourceX - 40) {
    sourceCpX = sourceX + curvature;
    sourceCpY = sourceY;
    targetCpX = targetX - curvature;
    targetCpY = targetY;
  } else {
    sourceCpX = sourceX + curvature;
    sourceCpY = sourceY;
    targetCpX = targetX - curvature;
    targetCpY = targetY;
    const dy = targetY - sourceY;
    const verticalOffset = Math.max(80, Math.abs(dy) * 0.5 + 40);
    const sign = dy >= 0 ? 1 : -1;
    sourceCpY += verticalOffset * sign;
    targetCpY += verticalOffset * sign;
  }
  
  // Cubic Bezier calculation for t = 0.5
  // B(0.5) = 0.125*P0 + 0.375*P1 + 0.375*P2 + 0.125*P3
  const midX = 0.125 * sourceX + 0.375 * sourceCpX + 0.375 * targetCpX + 0.125 * targetX;
  const midY = 0.125 * sourceY + 0.375 * sourceCpY + 0.375 * targetCpY + 0.125 * targetY;
  
  return { x: midX, y: midY };
}
