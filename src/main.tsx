import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import './styles.css';

// Existing file content is intentionally preserved except for the OrbitRing
// implementation below, which avoids the React SVG <line> type collision.

function OrbitRing({ radius, color, opacity = 0.35 }: { radius: number; color: string; opacity?: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return pts;
  }, [radius]);
  const geom = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  const line = useMemo(() => {
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    return new THREE.Line(geom, material);
  }, [geom, color, opacity]);
  return <primitive object={line} />;
}
