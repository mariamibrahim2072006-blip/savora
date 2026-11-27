import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { reducedMotion, isTouch } from '../lib/motion';

const COUNT = 140;

function EmberField() {
  const ref = useRef<THREE.Points>(null);
  const { positions, speeds, offsets } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    const offsets = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      speeds[i] = 0.15 + Math.random() * 0.5;
      offsets[i] = Math.random() * Math.PI * 2;
    }
    return { positions, speeds, offsets };
  }, []);

  useFrame(({ clock }) => {
    const pts = ref.current;
    if (!pts) return;
    const t = clock.getElapsedTime();
    const pos = pts.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      let y = pos.getY(i) + speeds[i] * 0.012;
      if (y > 7) y = -7;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.7 + offsets[i]) * 0.004);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.055} color="#e8b45a" transparent opacity={0.75} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

export default function Embers({ className }: { className?: string }) {
  if (reducedMotion() || isTouch()) return null;
  return (
    <div className={className} aria-hidden>
      <Canvas camera={{ position: [0, 0, 10], fov: 55 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}>
        <EmberField />
      </Canvas>
    </div>
  );
}
