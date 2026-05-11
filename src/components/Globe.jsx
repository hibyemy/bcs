import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

export default function Globe() {
  const mountRef = useRef(null);
  const frameRef = useRef(null);

  /* Memoize node data so it doesn't regenerate */
  const nodes = useMemo(() => {
    const pts = [];
    const cities = [
      { lat: 37.77, lng: -122.42, label: 'SFO' },    // San Francisco
      { lat: 51.51, lng: -0.13,   label: 'LON' },     // London
      { lat: 35.68, lng: 139.69,  label: 'TYO' },     // Tokyo
      { lat: -33.87, lng: 151.21, label: 'SYD' },     // Sydney
      { lat: 48.86, lng: 2.35,    label: 'PAR' },     // Paris
      { lat: 55.76, lng: 37.62,   label: 'MOW' },     // Moscow
      { lat: 1.35,  lng: 103.82,  label: 'SIN' },     // Singapore
      { lat: -23.55, lng: -46.63, label: 'SAO' },     // Sao Paulo
      { lat: 40.71, lng: -74.01,  label: 'NYC' },     // New York
      { lat: 30.04, lng: 31.24,   label: 'CAI' },     // Cairo
    ];
    for (const c of cities) {
      const phi = (90 - c.lat) * (Math.PI / 180);
      const theta = (c.lng + 180) * (Math.PI / 180);
      const x = -1.02 * Math.sin(phi) * Math.cos(theta);
      const y = 1.02 * Math.cos(phi);
      const z = 1.02 * Math.sin(phi) * Math.sin(theta);
      pts.push({ x, y, z, label: c.label });
    }
    return pts;
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    /* ── Scene setup ───────────────────────────── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    /* ── Wireframe sphere ──────────────────────── */
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    const wireframe = new THREE.WireframeGeometry(sphereGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.12,
    });
    const sphere = new THREE.LineSegments(wireframe, lineMat);
    scene.add(sphere);

    /* ── Bright latitude / longitude rings ─────── */
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.35,
    });

    // Equator
    const eqGeo = new THREE.BufferGeometry();
    const eqPts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      eqPts.push(Math.cos(a), 0, Math.sin(a));
    }
    eqGeo.setAttribute('position', new THREE.Float32BufferAttribute(eqPts, 3));
    scene.add(new THREE.Line(eqGeo, ringMat));

    // Prime meridian
    const pmGeo = new THREE.BufferGeometry();
    const pmPts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pmPts.push(Math.cos(a), Math.sin(a), 0);
    }
    pmGeo.setAttribute('position', new THREE.Float32BufferAttribute(pmPts, 3));
    scene.add(new THREE.Line(pmGeo, ringMat));

    /* ── Node dots ─────────────────────────────── */
    const dotGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    const glowGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.25,
    });

    for (const n of nodes) {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(n.x, n.y, n.z);
      scene.add(dot);

      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.set(n.x, n.y, n.z);
      scene.add(glow);
    }

    /* ── Connection arcs between random pairs ──── */
    const arcMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.2,
    });

    for (let i = 0; i < 6; i++) {
      const a = nodes[Math.floor(Math.random() * nodes.length)];
      const b = nodes[Math.floor(Math.random() * nodes.length)];
      if (a === b) continue;

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(a.x, a.y, a.z),
        new THREE.Vector3(
          (a.x + b.x) * 0.5 * 1.5,
          (a.y + b.y) * 0.5 * 1.5,
          (a.z + b.z) * 0.5 * 1.5
        ),
        new THREE.Vector3(b.x, b.y, b.z)
      );
      const pts = curve.getPoints(40);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(pts);
      scene.add(new THREE.Line(arcGeo, arcMat));
    }

    /* ── Ambient particles ─────────────────────── */
    const particleCount = 200;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      particlePositions[i] = (Math.random() - 0.5) * 6;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x22c55e,
      size: 0.008,
      transparent: true,
      opacity: 0.3,
    });
    scene.add(new THREE.Points(particleGeo, particleMat));

    /* ── Animate ───────────────────────────────── */
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      sphere.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    /* ── Resize handler ────────────────────────── */
    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    /* ── Cleanup ───────────────────────────────── */
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [nodes]);

  return (
    <div className="border-glow bg-black/60 p-3 flex flex-col">
      <div
        className="text-[10px] uppercase tracking-widest text-green-500/60 mb-2 font-bold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Global Uplink — Network Topology
      </div>
      <div ref={mountRef} className="w-full aspect-square max-h-[400px] relative">
        {/* Overlay labels */}
        <div className="absolute top-2 right-2 text-[9px] text-cyan-400/50 text-glow-cyan space-y-0.5">
          <div>● SFO</div>
          <div>● LON</div>
          <div>● TYO</div>
        </div>
        <div className="absolute bottom-2 left-2 text-[9px] text-green-500/30">
          NODES: 10 &nbsp;|&nbsp; LINKS: 6
        </div>
      </div>
    </div>
  );
}
