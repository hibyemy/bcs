import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useTelemetry } from './TelemetryContext';

export default function Globe() {
  const mountRef = useRef(null);
  const frameRef = useRef(null);
  const sceneRef = useRef(null);
  const issMeshRef = useRef(null);
  const nodeMeshRef = useRef(null);
  const eqGroupRef = useRef(null);

  const telemetry = useTelemetry();

  /* Memoize node data so it doesn't regenerate */
  const nodes = useMemo(() => {
    const pts = [];
    const cities = [
      { lat: 37.77, lng: -122.42, label: 'SFO' },
      { lat: 51.51, lng: -0.13,   label: 'LON' },
      { lat: 35.68, lng: 139.69,  label: 'TYO' },
      { lat: -33.87, lng: 151.21, label: 'SYD' },
      { lat: 48.86, lng: 2.35,    label: 'PAR' },
      { lat: 55.76, lng: 37.62,   label: 'MOW' },
      { lat: 1.35,  lng: 103.82,  label: 'SIN' },
      { lat: -23.55, lng: -46.63, label: 'SAO' },
      { lat: 40.71, lng: -74.01,  label: 'NYC' },
      { lat: 30.04, lng: 31.24,   label: 'CAI' },
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
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    /* ── Dynamic telemetry meshes ──────────────── */
    // 1. ISS (Red, larger glow, orbits slightly higher)
    const issGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const issMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
    const issMesh = new THREE.Mesh(issGeo, issMat);
    const issGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.4 })
    );
    issMesh.add(issGlow);
    issMesh.visible = false;
    scene.add(issMesh);
    issMeshRef.current = issMesh;

    // 2. Node (Yellow, current location)
    const nodeGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
    const nodeGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffea00, transparent: true, opacity: 0.3 })
    );
    nodeMesh.add(nodeGlow);
    nodeMesh.visible = false;
    scene.add(nodeMesh);
    nodeMeshRef.current = nodeMesh;

    // 3. Earthquakes Group
    const eqGroup = new THREE.Group();
    scene.add(eqGroup);
    eqGroupRef.current = eqGroup;

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

    const eqGeo = new THREE.BufferGeometry();
    const eqPts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      eqPts.push(Math.cos(a), 0, Math.sin(a));
    }
    eqGeo.setAttribute('position', new THREE.Float32BufferAttribute(eqPts, 3));
    scene.add(new THREE.Line(eqGeo, ringMat));

    const pmGeo = new THREE.BufferGeometry();
    const pmPts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pmPts.push(Math.cos(a), Math.sin(a), 0);
    }
    pmGeo.setAttribute('position', new THREE.Float32BufferAttribute(pmPts, 3));
    scene.add(new THREE.Line(pmGeo, ringMat));

    /* ── Node dots (Static Cities) ─────────────── */
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

    /* ── Connection arcs ───────────────────────── */
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
      
      // We rotate the main sphere structure, BUT we also want to rotate our dynamic telemetry.
      // Easiest is to rotate the entire scene slowly, or group the nodes.
      // But rotating the scene also rotates the camera's perspective of the background.
      // So let's rotate the meshes explicitly or group them.
      
      // Let's group all earth-bound things
      // Wait, currently they are added to `scene` directly.
      // If we just rotate the scene, everything turns.
      scene.rotation.y += 0.002;
      
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

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [nodes]);

  /* ── Effect to update dynamic telemetry positions ── */
  useEffect(() => {
    if (!telemetry) return;

    // Helper: Lat/Lng to ThreeJS vector (y is up)
    const toCoords = (lat, lng, radius = 1.02) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const x = -radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      return { x, y, z };
    };

    if (telemetry.iss && issMeshRef.current) {
      const { x, y, z } = toCoords(telemetry.iss.latitude, telemetry.iss.longitude, 1.06); // Orbits higher
      issMeshRef.current.position.set(x, y, z);
      issMeshRef.current.visible = true;
    }

    if (telemetry.node && nodeMeshRef.current) {
      const { x, y, z } = toCoords(telemetry.node.latitude, telemetry.node.longitude, 1.03);
      nodeMeshRef.current.position.set(x, y, z);
      nodeMeshRef.current.visible = true;
    }

    if (telemetry.earthquakes && eqGroupRef.current) {
      // Clear old EQ meshes
      while(eqGroupRef.current.children.length > 0){ 
          eqGroupRef.current.remove(eqGroupRef.current.children[0]); 
      }
      
      const eqGeo = new THREE.SphereGeometry(0.015, 8, 8);
      const eqMat = new THREE.MeshBasicMaterial({ color: 0xffa500 }); // Orange for seismic
      
      // Top 10 most recent
      telemetry.earthquakes.slice(0, 10).forEach(eq => {
         const coords = eq.geometry.coordinates; // [lng, lat, depth]
         const { x, y, z } = toCoords(coords[1], coords[0], 1.02);
         
         const mesh = new THREE.Mesh(eqGeo, eqMat);
         mesh.position.set(x, y, z);
         
         const mag = eq.properties.mag || 1;
         const scale = Math.max(0.5, mag * 0.4);
         mesh.scale.set(scale, scale, scale);
         
         eqGroupRef.current.add(mesh);
      });
    }

  }, [telemetry]);

  return (
    <div className="border-glow bg-black/60 p-3 flex flex-col relative overflow-hidden group">
      <div
        className="text-[10px] uppercase tracking-widest text-green-500/60 mb-2 font-bold relative z-10"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Global Uplink — Network Topology
      </div>
      
      <div ref={mountRef} className="w-full aspect-square max-h-[400px] relative">
        {/* Overlay labels */}
        <div className="absolute top-2 right-2 text-[9px] text-cyan-400/50 text-glow-cyan space-y-0.5 pointer-events-none">
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div> STATIC NODES</div>
          {telemetry?.iss && (
            <div className="flex items-center gap-1 mt-1 text-red-400/70 text-glow-none">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div> ISS_ORBIT
            </div>
          )}
          {telemetry?.node && (
            <div className="flex items-center gap-1 mt-1 text-yellow-400/70 text-glow-none">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div> NODE_DETECTED
            </div>
          )}
          {telemetry?.earthquakes?.length > 0 && (
            <div className="flex items-center gap-1 mt-1 text-orange-400/70 text-glow-none">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div> SEISMIC_ACTIVITY
            </div>
          )}
        </div>
        <div className="absolute bottom-2 left-2 text-[9px] text-green-500/30 pointer-events-none">
          NODES: 10 &nbsp;|&nbsp; LINKS: 6
        </div>
      </div>
    </div>
  );
}
