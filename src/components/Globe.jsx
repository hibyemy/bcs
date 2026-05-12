import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useTelemetry } from './TelemetryContext';

// Helper: Lat/Lng to ThreeJS vector (y is up)
const toCoords = (lat, lng, radius = 1.02) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return { x, y, z };
};

// Helper: Distance between two lat/lng points
const getDist = (lat1, lon1, lat2, lon2) => {
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p) / 2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p)) / 2;
  return 12742 * Math.asin(Math.sqrt(a));
};

export default function Globe() {
  const mountRef = useRef(null);
  const frameRef = useRef(null);
  
  const sceneRef = useRef(null);
  const issMeshRef = useRef(null);
  const nodeMeshRef = useRef(null);
  const eqGroupRef = useRef(null);
  const userArcRef = useRef(null);
  const edgeNodesRef = useRef({});
  const needsUpdateRef = useRef(true);

  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandedRef = useRef(isExpanded);

  useEffect(() => {
    isExpandedRef.current = isExpanded;
    needsUpdateRef.current = true; // Force render on toggle
  }, [isExpanded]);

  const telemetry = useTelemetry();

  const EDGE_NODES = useMemo(() => [
    // Major Global Nodes
    { id: 'SFO', lat: 37.77, lng: -122.42, label: 'CF-SFO', continent: 'NA', type: 'major' },
    { id: 'IAD', lat: 39.04, lng: -77.48,  label: 'CF-IAD', continent: 'NA', type: 'major' },
    { id: 'LHR', lat: 51.47, lng: -0.45,   label: 'CF-LHR', continent: 'EU', type: 'major' },
    { id: 'FRA', lat: 50.03, lng: 8.57,    label: 'CF-FRA', continent: 'EU', type: 'major' },
    { id: 'NRT', lat: 35.76, lng: 140.38,  label: 'CF-NRT', continent: 'AS', type: 'major' },
    { id: 'SIN', lat: 1.35,  lng: 103.98,  label: 'CF-SIN', continent: 'AS', type: 'major' },
    { id: 'SYD', lat: -33.94, lng: 151.17, label: 'CF-SYD', continent: 'OC', type: 'major' },
    { id: 'GRU', lat: -23.43, lng: -46.47, label: 'CF-GRU', continent: 'SA', type: 'major' },
    
    // Minor US Nodes (normally hidden)
    { id: 'LAX', lat: 34.05, lng: -118.24, label: 'CF-LAX', continent: 'NA', type: 'minor' },
    { id: 'SEA', lat: 47.60, lng: -122.33, label: 'CF-SEA', continent: 'NA', type: 'minor' },
    { id: 'DFW', lat: 32.77, lng: -96.79,  label: 'CF-DFW', continent: 'NA', type: 'minor' },
    { id: 'ORD', lat: 41.87, lng: -87.62,  label: 'CF-ORD', continent: 'NA', type: 'minor' },
    { id: 'MIA', lat: 25.76, lng: -80.19,  label: 'CF-MIA', continent: 'NA', type: 'minor' },
    { id: 'ATL', lat: 33.74, lng: -84.38,  label: 'CF-ATL', continent: 'NA', type: 'minor' },
    { id: 'DEN', lat: 39.73, lng: -104.99, label: 'CF-DEN', continent: 'NA', type: 'minor' },
    { id: 'EWR', lat: 40.71, lng: -74.00,  label: 'CF-EWR', continent: 'NA', type: 'minor' },
  ], []);

  const ORIGIN = { lat: 37.55, lng: -121.98, label: 'ORIGIN' }; // Fremont / Bay Area

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

    const eqGroup = new THREE.Group();
    scene.add(eqGroup);
    eqGroupRef.current = eqGroup;

    const userArcGroup = new THREE.Group();
    scene.add(userArcGroup);
    userArcRef.current = userArcGroup;

    const originGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const originMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const originMesh = new THREE.Mesh(originGeo, originMat);
    const oPos = toCoords(ORIGIN.lat, ORIGIN.lng, 1.02);
    originMesh.position.set(oPos.x, oPos.y, oPos.z);
    const originGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
    );
    originMesh.add(originGlow);
    scene.add(originMesh);

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

    const eqGeoBuffer = new THREE.BufferGeometry();
    const eqPts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      eqPts.push(Math.cos(a), 0, Math.sin(a));
    }
    eqGeoBuffer.setAttribute('position', new THREE.Float32BufferAttribute(eqPts, 3));
    scene.add(new THREE.Line(eqGeoBuffer, ringMat));

    const pmGeo = new THREE.BufferGeometry();
    const pmPts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pmPts.push(Math.cos(a), Math.sin(a), 0);
    }
    pmGeo.setAttribute('position', new THREE.Float32BufferAttribute(pmPts, 3));
    scene.add(new THREE.Line(pmGeo, ringMat));

    /* ── Edge Nodes ────────────────────────────── */
    const dotGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const glowGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.25 });

    EDGE_NODES.forEach(n => {
      const group = new THREE.Group();
      const dot = new THREE.Mesh(dotGeo, dotMat);
      const glow = new THREE.Mesh(glowGeo, glowMat);
      group.add(dot);
      group.add(glow);

      const pos = toCoords(n.lat, n.lng, 1.02);
      group.position.set(pos.x, pos.y, pos.z);
      scene.add(group);

      edgeNodesRef.current[n.id] = { group, data: n };
    });

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

    /* ── Controls ──────────────────────────────── */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 1.2;
    controls.maxDistance = 5;
    
    // Rotate scene to face North America initially
    scene.rotation.y = 1.5;
    scene.rotation.x = 0.2;

    /* ── Animate ───────────────────────────────── */
    let lastExpandedState = false;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      controls.enabled = isExpandedRef.current;

      if (isExpandedRef.current) {
        controls.update(); // Required for damping
        renderer.render(scene, camera);
        lastExpandedState = true;
      } else {
        if (lastExpandedState) {
          renderer.render(scene, camera);
          lastExpandedState = false;
        }
        if (needsUpdateRef.current) {
          renderer.render(scene, camera);
          needsUpdateRef.current = false;
        }
      }
    };
    animate();

    /* ── Resize handler ────────────────────────── */
    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      needsUpdateRef.current = true;
    };
    
    // We also need a resize observer for the container because
    // changing isExpanded changes the container size dynamically.
    const resizeObserver = new ResizeObserver(() => onResize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [EDGE_NODES]);

  /* ── Effect to update dynamic telemetry positions ── */
  useEffect(() => {
    if (!telemetry) return;

    if (telemetry.iss && issMeshRef.current) {
      const { x, y, z } = toCoords(telemetry.iss.latitude, telemetry.iss.longitude, 1.06); 
      issMeshRef.current.position.set(x, y, z);
      issMeshRef.current.visible = true;
      needsUpdateRef.current = true;
    }

    if (telemetry.earthquakes && eqGroupRef.current) {
      while(eqGroupRef.current.children.length > 0){ 
          eqGroupRef.current.remove(eqGroupRef.current.children[0]); 
      }
      const eqGeo = new THREE.SphereGeometry(0.015, 8, 8);
      const eqMat = new THREE.MeshBasicMaterial({ color: 0xffa500 });
      
      telemetry.earthquakes.slice(0, 10).forEach(eq => {
         const coords = eq.geometry.coordinates; 
         const { x, y, z } = toCoords(coords[1], coords[0], 1.02);
         const mesh = new THREE.Mesh(eqGeo, eqMat);
         mesh.position.set(x, y, z);
         const mag = eq.properties.mag || 1;
         const scale = Math.max(0.5, mag * 0.4);
         mesh.scale.set(scale, scale, scale);
         eqGroupRef.current.add(mesh);
      });
      needsUpdateRef.current = true;
    }

    // Node & Routing Logic
    if (telemetry.node && nodeMeshRef.current) {
      const userLat = telemetry.node.latitude;
      const userLng = telemetry.node.longitude;
      const userContinent = telemetry.node.continent_code || 'NA';

      // 1. Position User Node
      const { x, y, z } = toCoords(userLat, userLng, 1.03);
      nodeMeshRef.current.position.set(x, y, z);
      nodeMeshRef.current.visible = true;

      // 2. Hide Edge Nodes not in continent (Except SFO which is Host Edge)
      Object.values(edgeNodesRef.current).forEach(({ group, data }) => {
        if (data.id === 'SFO') {
          group.visible = true; 
        } else if (data.type === 'major' && data.continent === userContinent) {
          group.visible = true;
        } else {
          group.visible = false;
        }
      });

      // 3. Find Closest Edge Node for the User
      let closestEdge = null;
      let minDist = Infinity;
      Object.values(edgeNodesRef.current).forEach(({ data }) => {
        const d = getDist(userLat, userLng, data.lat, data.lng);
        if (d < minDist) {
          minDist = d;
          closestEdge = data;
        }
      });

      // Find an intermediate hop if distance > 1500km and we are expanded
      let midNode = null;
      const sfoNode = EDGE_NODES.find(n => n.id === 'SFO');
      const distSfoToUserEdge = getDist(sfoNode.lat, sfoNode.lng, closestEdge.lat, closestEdge.lng);
      
      if (distSfoToUserEdge > 1500 && closestEdge.id !== 'SFO') {
         const midLat = (sfoNode.lat + closestEdge.lat) / 2;
         const midLng = (sfoNode.lng + closestEdge.lng) / 2;
         let bestMidDist = Infinity;
         EDGE_NODES.forEach(n => {
            if (n.type === 'minor' && n.id !== closestEdge.id && n.id !== sfoNode.id) {
               const d = getDist(midLat, midLng, n.lat, n.lng);
               if (d < bestMidDist && d < (distSfoToUserEdge / 2)) {
                  bestMidDist = d;
                  midNode = n;
               }
            }
         });
      }

      // Activate nodes used in the path
      if (closestEdge) edgeNodesRef.current[closestEdge.id].group.visible = true;
      if (midNode && isExpanded) edgeNodesRef.current[midNode.id].group.visible = true;

      // 4. Draw Routing Arcs
      if (userArcRef.current && closestEdge) {
        while(userArcRef.current.children.length > 0){ 
            userArcRef.current.remove(userArcRef.current.children[0]); 
        }

        const drawArc = (lat1, lng1, lat2, lng2, color, opacity, heightMult) => {
          if (lat1 === lat2 && lng1 === lng2) return;
          const p1 = toCoords(lat1, lng1, 1.02);
          const p2 = toCoords(lat2, lng2, 1.02);
          const v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
          const v2 = new THREE.Vector3(p2.x, p2.y, p2.z);
          
          const dist = v1.distanceTo(v2);
          if (dist < 0.01) return;

          const curveHeight = 1 + (dist * heightMult);
          const mid = new THREE.Vector3(
            (v1.x + v2.x) * 0.5 * curveHeight,
            (v1.y + v2.y) * 0.5 * curveHeight,
            (v1.z + v2.z) * 0.5 * curveHeight
          );

          const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
          const pts = curve.getPoints(40);
          const arcGeo = new THREE.BufferGeometry().setFromPoints(pts);
          const arcMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
          userArcRef.current.add(new THREE.Line(arcGeo, arcMat));
        };

        drawArc(ORIGIN.lat, ORIGIN.lng, 37.77, -122.42, 0xffffff, 0.4, 0.2);
        
        if (isExpanded && midNode) {
          drawArc(37.77, -122.42, midNode.lat, midNode.lng, 0x06b6d4, 0.6, 0.4);
          drawArc(midNode.lat, midNode.lng, closestEdge.lat, closestEdge.lng, 0x06b6d4, 0.6, 0.4);
        } else {
          drawArc(37.77, -122.42, closestEdge.lat, closestEdge.lng, 0x06b6d4, 0.6, 0.4);
        }
        
        drawArc(closestEdge.lat, closestEdge.lng, userLat, userLng, 0xffea00, 0.8, 0.2);
      }
      needsUpdateRef.current = true;
    }

  }, [telemetry, isExpanded]);

  // Wrapper classes depend on expanded state
  const wrapperClass = isExpanded
    ? "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-10"
    : "border-glow bg-black/60 p-3 flex flex-col relative overflow-hidden group cursor-pointer hover:border-green-500/50 transition-colors";

  const containerClass = isExpanded
    ? "w-full max-w-4xl aspect-square relative"
    : "w-full aspect-square max-h-[400px] relative";

  return (
    <div className={wrapperClass} onClick={() => !isExpanded && setIsExpanded(true)}>
      
      {isExpanded && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(false);
          }}
          className="absolute top-6 right-6 text-green-500/50 hover:text-green-400 text-[10px] uppercase tracking-widest border border-green-500/20 px-4 py-2 bg-black/50 z-50 hover:border-green-500/50"
        >
          [CLOSE_UPLINK]
        </button>
      )}

      {/* When not expanded, show a hint */}
      {!isExpanded && (
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
           <div className="bg-black/80 px-3 py-1 border border-green-500/40 text-[10px] text-green-400 uppercase tracking-widest animate-pulse">
             CLICK_TO_EXPAND
           </div>
        </div>
      )}

      <div className="w-full flex flex-col">
        <div
          className="text-[10px] uppercase tracking-widest text-green-500/60 mb-2 font-bold relative z-10"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Global Uplink — Network Topology {isExpanded && '(ACTIVE)'}
        </div>
        
        <div ref={mountRef} className={containerClass}>
          {/* Overlay labels */}
          <div className="absolute top-2 right-2 text-[9px] text-cyan-400/50 text-glow-cyan space-y-0.5 pointer-events-none">
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-white rounded-full"></div> HOST_ORIGIN</div>
            <div className="flex items-center gap-1 mt-1"><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div> EDGE_NODES</div>
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
            ACTIVE REGION: {telemetry?.node?.continent_code || 'SCANNING'} &nbsp;|&nbsp; ROUTE_ESTABLISHED
          </div>
        </div>
      </div>
    </div>
  );
}
