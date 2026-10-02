import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Team, LightState, GraphicsQuality } from '../types/game';

interface ThreeCanvasProps {
  teams: Team[];
  trackLength: number;
  lightState: LightState;
  isMoving: boolean;
  winnerTeam: Team | null;
  graphicsQuality: GraphicsQuality;
  cameraPreset: 'ABOVE' | 'OVERVIEW' | 'CHASE' | 'FINISH' | 'GUARDIAN';
  onChangeCameraPreset?: (preset: 'ABOVE' | 'OVERVIEW' | 'CHASE' | 'FINISH' | 'GUARDIAN') => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetCamera?: () => void;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  teams,
  trackLength,
  lightState,
  winnerTeam,
  graphicsQuality,
  cameraPreset,
  onChangeCameraPreset,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Avatar group references for animation
  const avatarMeshesRef = useRef<Map<string, {
    group: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    body: THREE.Group;
    currentZ: number;
    targetZ: number;
    isStepAnimating: boolean;
    stepTime: number;
  }>>(new Map());

  // Guardian Hana reference
  const guardianRef = useRef<{
    root: THREE.Group;
    upperBody: THREE.Group;
    head: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    chestLight: THREE.Mesh;
    targetAngle: number;
    currentAngle: number;
  } | null>(null);

  // Traffic lights
  const trafficLightBulbs = useRef<{
    greenBulbs: THREE.Mesh[];
    redBulbs: THREE.Mesh[];
    lightFixtures: THREE.PointLight[];
  }>({ greenBulbs: [], redBulbs: [], lightFixtures: [] });

  // Floating celebration particles
  const particlesRef = useRef<THREE.Points | null>(null);

  // Camera animation target: frames runners directly in view
  const cameraTargetRef = useRef<{
    pos: THREE.Vector3;
    lookAt: THREE.Vector3;
    zoomLevel: number;
  }>({
    pos: new THREE.Vector3(0, 16.0, -24.0),
    lookAt: new THREE.Vector3(0, 1.6, 10.0),
    zoomLevel: 1.0,
  });

  const [zoomFactor, setZoomFactor] = useState(1.0);

  // Lane dimensions
  const laneWidth = 3.6;
  const trackStartZ = 0;
  const trackEndZ = trackLength * 4.5; // each step is 4.5 units in 3D
  const finishZ = trackEndZ;

  // Initialize Three.js scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.FogExp2(0x9bd4f0, 0.008);
    sceneRef.current = scene;

    // Camera: Calibrated so starting runners are centered and track extends toward Guardian Hana
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 300);
    camera.position.set(0, 16.0, -24.0);
    camera.lookAt(0, 1.6, 10.0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: graphicsQuality !== 'LOW',
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(
      graphicsQuality === 'HIGH' ? Math.min(window.devicePixelRatio, 2) : 1
    );
    renderer.shadowMap.enabled = graphicsQuality !== 'LOW';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Mouse wheel zoom support
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoomFactor(prev => Math.max(0.6, Math.min(2.5, prev - e.deltaY * 0.0012)));
    };
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Handle context loss
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('WebGL context lost');
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    // ==================== ENVIRONMENT & LIGHTING ====================
    // Ambient light
    const ambient = new THREE.AmbientLight(0xdff0ff, 0.85);
    scene.add(ambient);

    // Key Sun Light
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
    sunLight.position.set(25, 45, 10);
    sunLight.castShadow = graphicsQuality !== 'LOW';
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = graphicsQuality === 'HIGH' ? 2048 : 1024;
      sunLight.shadow.mapSize.height = graphicsQuality === 'HIGH' ? 2048 : 1024;
      sunLight.shadow.camera.near = 1;
      sunLight.shadow.camera.far = 160;
      sunLight.shadow.camera.left = -45;
      sunLight.shadow.camera.right = 45;
      sunLight.shadow.camera.top = 70;
      sunLight.shadow.camera.bottom = -25;
    }
    scene.add(sunLight);

    // Fill Light from back
    const fillLight = new THREE.DirectionalLight(0x73b0ff, 0.5);
    fillLight.position.set(-25, 20, 50);
    scene.add(fillLight);

    // Ground: Grass Field
    const grassGeo = new THREE.PlaneGeometry(160, 240);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x48a860,
      roughness: 0.85,
      metalness: 0.05,
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, 0, trackEndZ / 2);
    grass.receiveShadow = true;
    scene.add(grass);

    // Arena Perimeter Stadium Walls
    const wallHeight = 12;
    const wallLength = 220;
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x243242,
      roughness: 0.6,
      metalness: 0.1,
    });

    // Left wall
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(2, wallHeight, wallLength), wallMat);
    wallLeft.position.set(-36, wallHeight / 2, trackEndZ / 2);
    wallLeft.receiveShadow = true;
    scene.add(wallLeft);

    // Right wall
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(2, wallHeight, wallLength), wallMat);
    wallRight.position.set(36, wallHeight / 2, trackEndZ / 2);
    wallRight.receiveShadow = true;
    scene.add(wallRight);

    // Back wall behind start
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(74, wallHeight, 2), wallMat);
    wallBack.position.set(0, wallHeight / 2, -25);
    wallBack.receiveShadow = true;
    scene.add(wallBack);

    // Back wall behind finish (guardian wall)
    const wallFinish = new THREE.Mesh(new THREE.BoxGeometry(74, wallHeight * 1.5, 2), wallMat);
    wallFinish.position.set(0, (wallHeight * 1.5) / 2, finishZ + 35);
    wallFinish.receiveShadow = true;
    scene.add(wallFinish);

    // Colorful Stadium Banners along walls
    const bannerColors = [0x3B82F6, 0x10B981, 0xF59E0B, 0xEF4444, 0x8B5CF6];
    for (let i = -10; i <= finishZ + 20; i += 18) {
      const bColor = bannerColors[Math.abs(Math.floor(i / 18)) % bannerColors.length];
      const bannerMat = new THREE.MeshStandardMaterial({ color: bColor, roughness: 0.4 });
      
      const bLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 10), bannerMat);
      bLeft.position.set(-34.8, 6.5, i);
      scene.add(bLeft);

      const bRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 10), bannerMat);
      bRight.position.set(34.8, 6.5, i);
      scene.add(bRight);
    }

    // Soft Procedural Sky Clouds
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: 0.85,
    });
    for (let c = 0; c < 12; c++) {
      const cloudGroup = new THREE.Group();
      const puffs = 3 + Math.floor(Math.random() * 3);
      for (let p = 0; p < puffs; p++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random() * 3, 7, 6), cloudMat);
        puff.position.set(p * 3.5, Math.random() * 1.5, Math.random() * 2);
        cloudGroup.add(puff);
      }
      cloudGroup.position.set(
        (Math.random() - 0.5) * 110,
        35 + Math.random() * 18,
        (Math.random() - 0.5) * 160 + trackEndZ / 2
      );
      scene.add(cloudGroup);
    }

    // ==================== RUNNING TRACK ====================
    const totalTrackLanes = Math.max(teams.length, 4);
    const trackWidth = totalTrackLanes * laneWidth + 2;
    const trackGeo = new THREE.PlaneGeometry(trackWidth, finishZ + 18);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0xBF5B45, // Clay/terracotta athletic running surface
      roughness: 0.7,
      metalness: 0.05,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.rotation.x = -Math.PI / 2;
    trackMesh.position.set(0, 0.03, finishZ / 2 + 2);
    trackMesh.receiveShadow = true;
    scene.add(trackMesh);

    // Lane Chalk Lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i <= totalTrackLanes; i++) {
      const lineX = -trackWidth / 2 + 1 + i * laneWidth;
      const laneLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.14, finishZ + 18),
        lineMat
      );
      laneLine.rotation.x = -Math.PI / 2;
      laneLine.position.set(lineX, 0.04, finishZ / 2 + 2);
      scene.add(laneLine);
    }

    // Step Yard Markers across the track
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let s = 1; s <= trackLength; s++) {
      const stepZ = s * 4.5;
      const marker = new THREE.Mesh(
        new THREE.PlaneGeometry(trackWidth - 1, 0.16),
        markerMat
      );
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(0, 0.045, stepZ);
      scene.add(marker);
    }

    // START LINE (Flat ground marker, no tall pillars or arch to obstruct view)
    const startLineMat = new THREE.MeshStandardMaterial({ color: 0x22C55E, roughness: 0.5 });
    const startLine = new THREE.Mesh(new THREE.BoxGeometry(trackWidth, 0.1, 1.2), startLineMat);
    startLine.position.set(0, 0.05, 0);
    scene.add(startLine);

    // ==================== FINISH LINE & ARCH ====================
    // Checkered Finish Line ribbon/mat
    const finishLineWidth = trackWidth;
    const finishLineMat = new THREE.MeshStandardMaterial({
      color: 0xFBBF24,
      roughness: 0.4,
      metalness: 0.2,
    });
    const finishLineMesh = new THREE.Mesh(
      new THREE.BoxGeometry(finishLineWidth, 0.12, 2.5),
      finishLineMat
    );
    finishLineMesh.position.set(0, 0.06, finishZ);
    scene.add(finishLineMesh);

    // ==================== GIANT STADIUM TRAFFIC LIGHTS ====================
    const redBulbs: THREE.Mesh[] = [];
    const greenBulbs: THREE.Mesh[] = [];
    const lightFixtures: THREE.PointLight[] = [];

    const createTrafficBeacon = (x: number, z: number) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 14),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 })
      );
      pole.position.set(x, 7, z);
      scene.add(pole);

      const housing = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 5.2, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.3 })
      );
      housing.position.set(x, 12, z);
      scene.add(housing);

      // Red bulb
      const redMat = new THREE.MeshStandardMaterial({
        color: 0x4A0404,
        emissive: 0x000000,
        emissiveIntensity: 0.1,
        roughness: 0.2,
      });
      const rBulb = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), redMat);
      rBulb.position.set(x, 13.2, z - 0.6);
      scene.add(rBulb);
      redBulbs.push(rBulb);

      // Green bulb
      const greenMat = new THREE.MeshStandardMaterial({
        color: 0x022c15,
        emissive: 0x22C55E,
        emissiveIntensity: 1.5,
        roughness: 0.2,
      });
      const gBulb = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), greenMat);
      gBulb.position.set(x, 10.8, z - 0.6);
      scene.add(gBulb);
      greenBulbs.push(gBulb);

      // Dynamic light
      const pLight = new THREE.PointLight(0x22C55E, 2.5, 30);
      pLight.position.set(x, 12, z - 1.2);
      scene.add(pLight);
      lightFixtures.push(pLight);
    };

    createTrafficBeacon(-trackWidth / 2 - 4.5, finishZ - 4);
    createTrafficBeacon(trackWidth / 2 + 4.5, finishZ - 4);

    trafficLightBulbs.current = { greenBulbs, redBulbs, lightFixtures };

    // ==================== ORIGINAL GUARDIAN HANA ====================
    // Positioned 12 units past the finish line, elevated on a round pastel podium
    const guardianRoot = new THREE.Group();
    guardianRoot.position.set(0, 0, finishZ + 14);

    // Decorative circular podium
    const podiumMat = new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.4 });
    const podium = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.2, 1.2, 32), podiumMat);
    podium.position.set(0, 0.6, 0);
    guardianRoot.add(podium);

    // Lower body / legs / shoes
    const lowerBody = new THREE.Group();
    const sockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0EA5E9, roughness: 0.3 }); // Teal sneakers

    const leftLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 3.5), sockMat);
    leftLegMesh.position.set(-1.1, 2.9, 0);
    lowerBody.add(leftLegMesh);

    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.8), shoeMat);
    leftShoe.position.set(-1.1, 1.5, 0.3);
    lowerBody.add(leftShoe);

    const rightLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 3.5), sockMat);
    rightLegMesh.position.set(1.1, 2.9, 0);
    lowerBody.add(rightLegMesh);

    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.8), shoeMat);
    rightShoe.position.set(1.1, 1.5, 0.3);
    lowerBody.add(rightShoe);

    guardianRoot.add(lowerBody);

    // Swiveling Upper Body (Torso, Arms, Head)
    // Rotates 180 deg when switching between Green and Red lights
    const upperBody = new THREE.Group();
    upperBody.position.set(0, 4.5, 0);

    // Dress / Hoodie: Original Bright Orange & Teal outfit
    const dressMat = new THREE.MeshStandardMaterial({ color: 0xF97316, roughness: 0.5 });
    const dress = new THREE.Mesh(new THREE.ConeGeometry(2.4, 4.2, 20), dressMat);
    dress.position.set(0, 1.8, 0);
    upperBody.add(dress);

    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x06B6D4, roughness: 0.4 });
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 1.6, 20), shirtMat);
    collar.position.set(0, 3.6, 0);
    upperBody.add(collar);

    // Chest indicator light
    const chestLightMat = new THREE.MeshStandardMaterial({
      color: 0x22C55E,
      emissive: 0x22C55E,
      emissiveIntensity: 1.8,
    });
    const chestLight = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), chestLightMat);
    chestLight.position.set(0, 3.3, 1.25);
    upperBody.add(chestLight);

    // Friendly Jointed Arms
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xFFDCB8, roughness: 0.6 });

    const leftArm = new THREE.Group();
    leftArm.position.set(-1.8, 3.4, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.8), dressMat);
    leftArmMesh.position.set(0, -1.2, 0);
    leftArm.add(leftArmMesh);
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), skinMat);
    leftHand.position.set(0, -2.6, 0);
    leftArm.add(leftHand);
    upperBody.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(1.8, 3.4, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.8), dressMat);
    rightArmMesh.position.set(0, -1.2, 0);
    rightArm.add(rightArmMesh);
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), skinMat);
    rightHand.position.set(0, -2.6, 0);
    rightArm.add(rightHand);
    upperBody.add(rightArm);

    // Friendly Doll Head
    const head = new THREE.Group();
    head.position.set(0, 5.2, 0);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 24), skinMat);
    head.add(headMesh);

    // Hair: Stylized dark teal hair buns with cute orange clips
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x164E63, roughness: 0.7 });
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(1.68, 20, 16, 0, Math.PI * 2, 0, Math.PI / 1.7), hairMat);
    hairCap.position.set(0, 0.15, -0.1);
    head.add(hairCap);

    // Left bun
    const bunL = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), hairMat);
    bunL.position.set(-1.6, 1.2, -0.2);
    head.add(bunL);

    // Right bun
    const bunR = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), hairMat);
    bunR.position.set(1.6, 1.2, -0.2);
    head.add(bunR);

    // Hair clips
    const clipMat = new THREE.MeshStandardMaterial({ color: 0xF97316 });
    const clipL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.15), clipMat);
    clipL.rotation.z = Math.PI / 2;
    clipL.position.set(-1.6, 1.2, 0.6);
    head.add(clipL);

    const clipR = clipL.clone();
    clipR.position.set(1.6, 1.2, 0.6);
    head.add(clipR);

    // Cute Big Cartoon Eyes
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x1E1B4B });
    const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), eyeWhiteMat);
    leftEye.scale.set(1, 1.2, 0.4);
    leftEye.position.set(-0.55, 0.2, 1.45);
    head.add(leftEye);

    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), eyePupilMat);
    leftPupil.scale.set(1, 1.1, 0.3);
    leftPupil.position.set(-0.55, 0.2, 1.6);
    head.add(leftPupil);

    const leftSparkle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), sparkleMat);
    leftSparkle.position.set(-0.48, 0.3, 1.7);
    head.add(leftSparkle);

    const rightEye = leftEye.clone();
    rightEye.position.set(0.55, 0.2, 1.45);
    head.add(rightEye);

    const rightPupil = leftPupil.clone();
    rightPupil.position.set(0.55, 0.2, 1.6);
    head.add(rightPupil);

    const rightSparkle = leftSparkle.clone();
    rightSparkle.position.set(0.62, 0.3, 1.7);
    head.add(rightSparkle);

    // Rosy Cheeks
    const cheekMat = new THREE.MeshBasicMaterial({ color: 0xFB7185 });
    const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), cheekMat);
    cheekL.scale.set(1.4, 0.8, 0.2);
    cheekL.position.set(-0.9, -0.2, 1.35);
    head.add(cheekL);

    const cheekR = cheekL.clone();
    cheekR.position.set(0.9, -0.2, 1.35);
    head.add(cheekR);

    // Smiling Cartoon Mouth
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x991B1B });
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 8, 16, Math.PI), smileMat);
    mouth.rotation.x = Math.PI;
    mouth.rotation.z = Math.PI;
    mouth.position.set(0, -0.5, 1.45);
    head.add(mouth);

    upperBody.add(head);
    guardianRoot.add(upperBody);
    scene.add(guardianRoot);

    guardianRef.current = {
      root: guardianRoot,
      upperBody,
      head,
      leftArm,
      rightArm,
      chestLight,
      targetAngle: Math.PI, // Green light starts facing away
      currentAngle: Math.PI,
    };

    // ==================== CELEBRATION PARTICLES ====================
    const particleCount = 200;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);

    const palette = [
      [0.9, 0.2, 0.2],
      [0.2, 0.6, 0.9],
      [0.1, 0.8, 0.4],
      [0.95, 0.75, 0.1],
      [0.8, 0.3, 0.9],
    ];

    for (let p = 0; p < particleCount; p++) {
      pPos[p * 3] = (Math.random() - 0.5) * trackWidth * 1.5;
      pPos[p * 3 + 1] = Math.random() * 15 + 1;
      pPos[p * 3 + 2] = finishZ + (Math.random() - 0.5) * 15;

      const c = palette[p % palette.length];
      pColors[p * 3] = c[0];
      pColors[p * 3 + 1] = c[1];
      pColors[p * 3 + 2] = c[2];
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0, // initially invisible, blooms during winner
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);
    particlesRef.current = particles;

    // Resize handler
    const handleResize = () => {
      if (!mount || !rendererRef.current || !cameraRef.current) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) {
        rendererRef.current.domElement.removeEventListener('webglcontextlost', handleContextLost);
      }
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [trackLength, graphicsQuality]);

  // ==================== AVATARS SETUP & UPDATES ====================
  // Stable key: only recreate avatar 3D models if team count, avatars, colors, or numbers change
  const teamsStructureKey = teams.map(t => `${t.id}:${t.avatar}:${t.color}:${t.number}`).join('|');

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const totalTrackLanes = Math.max(teams.length, 4);
    const trackWidth = totalTrackLanes * laneWidth + 2;

    // Check which avatars need to be kept, updated, or created
    const currentTeamIds = new Set(teams.map(t => t.id));

    // Remove avatars that no longer exist
    avatarMeshesRef.current.forEach((av, id) => {
      if (!currentTeamIds.has(id)) {
        scene.remove(av.group);
        avatarMeshesRef.current.delete(id);
      }
    });

    // Create 3D stylized contestant avatar for each team if not already existing
    teams.forEach((team, index) => {
      const laneX = -trackWidth / 2 + 1 + index * laneWidth + laneWidth / 2;
      const targetZ = team.position * 4.5;

      const existing = avatarMeshesRef.current.get(team.id);
      if (existing) {
        // Just update lane X if layout adjusted, keep currentZ so running animation continues smoothly!
        existing.group.position.x = laneX;
        existing.targetZ = targetZ;
        return;
      }

      const group = new THREE.Group();
      const initialZ = team.position * 4.5;
      group.position.set(laneX, 0, initialZ);

      // Colors
      const teamColor = new THREE.Color(team.color);
      const suitMat = new THREE.MeshStandardMaterial({
        color: teamColor,
        roughness: 0.45,
        metalness: 0.1,
      });
      const trimMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
      });
      const skinMat = new THREE.MeshStandardMaterial({
        color: 0xFCD34D,
        roughness: 0.6,
      });

      // Body / Torso
      const body = new THREE.Group();
      body.position.set(0, 1.45, 0);

      // Tracksuit Jacket
      const jacket = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.3, 0.7), suitMat);
      jacket.castShadow = true;
      body.add(jacket);

      // White chest zipper
      const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.32, 0.72), trimMat);
      body.add(zipper);

      // Participant Number Plate (Canvas texture)
      const numCanvas = document.createElement('canvas');
      numCanvas.width = 128;
      numCanvas.height = 128;
      const ctx = numCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 54px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${team.number}`, 64, 64);
      }
      const numTex = new THREE.CanvasTexture(numCanvas);
      const numMat = new THREE.MeshBasicMaterial({ map: numTex });

      // Front number badge
      const numBadgeFront = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), numMat);
      numBadgeFront.position.set(0.3, 0.2, 0.36);
      body.add(numBadgeFront);

      // Back number badge
      const numBadgeBack = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.65), numMat);
      numBadgeBack.rotation.y = Math.PI;
      numBadgeBack.position.set(0, 0.1, -0.36);
      body.add(numBadgeBack);

      group.add(body);

      // Stylized Head depending on avatar type
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 2.45, 0);

      if (team.avatar === 'robot') {
        const botHead = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 0.85), new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.7 }));
        const botVisor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.1), new THREE.MeshBasicMaterial({ color: 0x06B6D4 }));
        botVisor.position.set(0, 0.05, 0.43);
        const botAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5), new THREE.MeshStandardMaterial({ color: 0xF59E0B }));
        botAntenna.position.set(0, 0.65, 0);
        headGroup.add(botHead);
        headGroup.add(botVisor);
        headGroup.add(botAntenna);
      } else if (team.avatar === 'astronaut') {
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 16), new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.3 }));
        const visor = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.9, roughness: 0.1 }));
        visor.rotation.x = Math.PI / 2;
        visor.position.set(0, 0, 0.25);
        headGroup.add(helmet);
        headGroup.add(visor);
      } else if (team.avatar === 'mascot_bear') {
        const bearHead = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), new THREE.MeshStandardMaterial({ color: 0x92400E, roughness: 0.8 }));
        const earL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshStandardMaterial({ color: 0x78350F }));
        earL.position.set(-0.45, 0.45, 0);
        const earR = earL.clone();
        earR.position.set(0.45, 0.45, 0);
        const snout = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), new THREE.MeshStandardMaterial({ color: 0xFDE68A }));
        snout.position.set(0, -0.1, 0.48);
        headGroup.add(bearHead);
        headGroup.add(earL);
        headGroup.add(earR);
        headGroup.add(snout);
      } else {
        // Human stylized face with hair
        const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), skinMat);
        headGroup.add(headMesh);

        const hairColor = team.avatar === 'runner_girl' ? 0x92400E : 0x1E293B;
        const hair = new THREE.Mesh(
          new THREE.SphereGeometry(0.58, 14, 14, 0, Math.PI * 2, 0, Math.PI / 1.8),
          new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.7 })
        );
        hair.position.set(0, 0.08, -0.05);
        headGroup.add(hair);

        if (team.avatar === 'runner_girl') {
          const ponytail = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 10), new THREE.MeshStandardMaterial({ color: hairColor }));
          ponytail.rotation.x = -Math.PI / 2.5;
          ponytail.position.set(0, 0.2, -0.6);
          headGroup.add(ponytail);
        } else if (team.avatar === 'champion') {
          const headband = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.08, 8, 20), new THREE.MeshStandardMaterial({ color: 0xFBBF24 }));
          headband.rotation.x = Math.PI / 2;
          headband.position.set(0, 0.15, 0);
          headGroup.add(headband);
        }

        // Eyes
        const eyeDotMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeDotMat);
        eyeL.position.set(-0.2, 0.05, 0.5);
        const eyeR = eyeL.clone();
        eyeR.position.set(0.2, 0.05, 0.5);
        headGroup.add(eyeL);
        headGroup.add(eyeR);
      }

      group.add(headGroup);

      // Articulated Limbs
      // Left Arm
      const leftArm = new THREE.Group();
      leftArm.position.set(-0.75, 2.0, 0);
      const lArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.9), suitMat);
      lArmMesh.position.set(0, -0.45, 0);
      leftArm.add(lArmMesh);
      const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), skinMat);
      lHand.position.set(0, -0.9, 0);
      leftArm.add(lHand);
      group.add(leftArm);

      // Right Arm
      const rightArm = new THREE.Group();
      rightArm.position.set(0.75, 2.0, 0);
      const rArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.9), suitMat);
      rArmMesh.position.set(0, -0.45, 0);
      rightArm.add(rArmMesh);
      const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), skinMat);
      rHand.position.set(0, -0.9, 0);
      rightArm.add(rHand);
      group.add(rightArm);

      // Left Leg
      const leftLeg = new THREE.Group();
      leftLeg.position.set(-0.35, 1.0, 0);
      const lLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.0), suitMat);
      lLegMesh.position.set(0, -0.5, 0);
      leftLeg.add(lLegMesh);
      const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.65), trimMat);
      lShoe.position.set(0, -1.0, 0.12);
      leftLeg.add(lShoe);
      group.add(leftLeg);

      // Right Leg
      const rightLeg = new THREE.Group();
      rightLeg.position.set(0.35, 1.0, 0);
      const rLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.0), suitMat);
      rLegMesh.position.set(0, -0.5, 0);
      rightLeg.add(rLegMesh);
      const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.65), trimMat);
      rShoe.position.set(0, -1.0, 0.12);
      rightLeg.add(rShoe);
      group.add(rightLeg);

      scene.add(group);

      avatarMeshesRef.current.set(team.id, {
        group,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
        body,
        currentZ: initialZ,
        targetZ: targetZ,
        isStepAnimating: false,
        stepTime: 0,
      });
    });
  }, [teamsStructureKey, trackLength]);

  // Sync positions when teams update
  useEffect(() => {
    teams.forEach(team => {
      const av = avatarMeshesRef.current.get(team.id);
      if (av) {
        const newTargetZ = team.position * 4.5;
        if (Math.abs(av.targetZ - newTargetZ) > 0.01) {
          av.targetZ = newTargetZ;
          av.isStepAnimating = true;
          av.stepTime = 0;
        }
      }
    });
  }, [teams]);

  // Sync Light State (Guardian Hana & Traffic lights)
  useEffect(() => {
    const isGreen = lightState === 'GREEN';
    if (guardianRef.current) {
      // GREEN LIGHT: Guardian turns around facing away (targetAngle = Math.PI)
      // RED LIGHT: Guardian faces contestants (targetAngle = 0)
      guardianRef.current.targetAngle = isGreen ? Math.PI : 0;

      // Chest light color
      const lightColor = isGreen ? 0x22C55E : 0xEF4444;
      (guardianRef.current.chestLight.material as THREE.MeshStandardMaterial).color.setHex(lightColor);
      (guardianRef.current.chestLight.material as THREE.MeshStandardMaterial).emissive.setHex(lightColor);
    }

    // Traffic light fixtures
    const bulbs = trafficLightBulbs.current;
    bulbs.greenBulbs.forEach(b => {
      const mat = b.material as THREE.MeshStandardMaterial;
      if (isGreen) {
        mat.emissive.setHex(0x22C55E);
        mat.emissiveIntensity = 2.2;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.1;
      }
    });

    bulbs.redBulbs.forEach(b => {
      const mat = b.material as THREE.MeshStandardMaterial;
      if (!isGreen) {
        mat.emissive.setHex(0xEF4444);
        mat.emissiveIntensity = 2.2;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.1;
      }
    });

    bulbs.lightFixtures.forEach(light => {
      light.color.setHex(isGreen ? 0x22C55E : 0xEF4444);
      light.intensity = 2.8;
    });
  }, [lightState]);

  // Sync Camera Presets
  useEffect(() => {
    const target = cameraTargetRef.current;
    // Find leader position for camera chase
    const maxPos = Math.max(...teams.map(t => t.position), 0);
    const leaderZ = maxPos * 4.5;

    if (winnerTeam) {
      // Focus on winner at finish line
      target.pos.set(0, 8, finishZ - 10);
      target.lookAt.set(0, 3, finishZ + 6);
      return;
    }

    switch (cameraPreset) {
      case 'ABOVE':
        // High overhead bird's-eye camera: view the entire arena and all contestants from above
        target.pos.set(0, 28, finishZ * 0.42);
        target.lookAt.set(0, 0, finishZ * 0.52);
        break;
      case 'OVERVIEW': {
        // Encompass ALL teams, ensuring any team still at the start line remains fully visible
        const positions = teams.map(t => t.position);
        const minPos = positions.length > 0 ? Math.min(...positions) : 0;
        const maxPos = positions.length > 0 ? Math.max(...positions) : 0;
        const minZ = minPos * 4.5;
        const maxZ = maxPos * 4.5;
        const spreadZ = maxZ - minZ;
        const midZ = (minZ + maxZ) / 2;

        // Position camera sufficiently elevated and pulled back so the start line and all lanes
        // are 100% visible within the center viewport channel
        const camZ = minZ - 24.0;
        const camY = 16.0 + spreadZ * 0.22;
        const lookZ = Math.max(midZ + 8.0, 10.0);

        target.pos.set(0, camY, camZ);
        target.lookAt.set(0, 1.6, lookZ);
        break;
      }
      case 'CHASE':
        // Close third-person follow cam right behind contestants
        target.pos.set(0, 5.5, Math.max(leaderZ - 10, -10));
        target.lookAt.set(0, 2.2, leaderZ + 16);
        break;
      case 'FINISH':
        // Facing oncoming runners from finish line
        target.pos.set(0, 5.0, finishZ + 3);
        target.lookAt.set(0, 2.0, Math.max(leaderZ, 0));
        break;
      case 'GUARDIAN':
        // Close up of Guardian Hana and finish arch
        target.pos.set(0, 8.0, finishZ + 4);
        target.lookAt.set(0, 5.5, finishZ + 14);
        break;
    }
  }, [cameraPreset, teams, winnerTeam, finishZ]);

  // Celebration particles update when winner is declared
  useEffect(() => {
    if (particlesRef.current) {
      const mat = particlesRef.current.material as THREE.PointsMaterial;
      mat.opacity = winnerTeam ? 0.95 : 0;
    }
  }, [winnerTeam]);

  // ==================== ANIMATION LOOP ====================
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // 1. Guardian Hana rotation and head bobbing
      const g = guardianRef.current;
      if (g) {
        // Smoothly interpolate angle
        const angleDiff = g.targetAngle - g.currentAngle;
        g.currentAngle += angleDiff * Math.min(dt * 7, 1);
        g.upperBody.rotation.y = g.currentAngle;

        // Head subtle scan during RED LIGHT
        if (lightState === 'RED') {
          g.head.rotation.y = Math.sin(time * 0.003) * 0.35;
          g.head.rotation.x = Math.sin(time * 0.002) * 0.08;
        } else {
          g.head.rotation.y = 0;
          g.head.rotation.x = 0;
        }

        // Winner celebration wave
        if (winnerTeam) {
          g.leftArm.rotation.z = Math.sin(time * 0.01) * 0.8 - 1.6;
          g.rightArm.rotation.z = -Math.sin(time * 0.01) * 0.8 + 1.6;
          g.upperBody.position.y = 4.5 + Math.abs(Math.sin(time * 0.008)) * 0.6;
        } else {
          g.leftArm.rotation.z = 0;
          g.rightArm.rotation.z = 0;
          g.upperBody.position.y = 4.5;
        }
      }

      // 2. Avatar Movement & Running Stride Animations
      avatarMeshesRef.current.forEach((av) => {
        const diffZ = av.targetZ - av.currentZ;

        if (Math.abs(diffZ) > 0.02) {
          // Running forward with steady athletic stride
          const speed = Math.max(Math.abs(diffZ) * 4.0, 5.5);
          const stepDelta = Math.sign(diffZ) * Math.min(Math.abs(diffZ), speed * dt);
          av.currentZ += stepDelta;
          av.group.position.z = av.currentZ;
          av.stepTime += dt * 16;

          // Running leg stride animation
          const legAngle = Math.sin(av.stepTime) * 0.95;
          av.leftLeg.rotation.x = legAngle;
          av.rightLeg.rotation.x = -legAngle;

          // Arm swing opposite to legs
          av.leftArm.rotation.x = -legAngle * 0.95;
          av.rightArm.rotation.x = legAngle * 0.95;

          // Energetic body running bounce
          av.body.position.y = 1.45 + Math.abs(Math.sin(av.stepTime * 2)) * 0.22;
          av.group.rotation.y = 0; // facing forward
        } else {
          // Settled in position
          av.currentZ = av.targetZ;
          av.group.position.z = av.currentZ;

          // Smoothly return limbs to idle stance
          av.leftLeg.rotation.x *= 0.85;
          av.rightLeg.rotation.x *= 0.85;
          av.leftArm.rotation.x *= 0.85;
          av.rightArm.rotation.x *= 0.85;

          if (av.isStepAnimating) {
            // Little celebration hop when reaching new step!
            av.stepTime += dt * 8;
            av.body.position.y = 1.45 + Math.max(0, Math.sin(av.stepTime * Math.PI) * 0.4);
            if (av.stepTime > 1.2) {
              av.isStepAnimating = false;
              av.body.position.y = 1.45;
            }
          } else {
            // Idle gentle breathing sway
            av.body.position.y = 1.45 + Math.sin(time * 0.003 + av.group.position.x) * 0.04;
          }
        }
      });

      // 3. Floating particles rotation
      if (particlesRef.current && winnerTeam) {
        particlesRef.current.rotation.y += dt * 0.4;
      }

      // 4. Smooth Camera Damping (lerp)
      if (cameraRef.current) {
        const cam = cameraRef.current;
        const target = cameraTargetRef.current;

        // Apply zoom factor
        const adjustedTargetPos = new THREE.Vector3(
          target.pos.x,
          target.pos.y / zoomFactor,
          target.pos.z
        );

        cam.position.lerp(adjustedTargetPos, dt * 3.5);

        // Interpolate lookAt via temporary vector
        const currentLookAt = new THREE.Vector3();
        cam.getWorldDirection(currentLookAt);
        const desiredLook = target.lookAt.clone().sub(cam.position).normalize();
        currentLookAt.lerp(desiredLook, dt * 4);
        cam.lookAt(cam.position.clone().add(currentLookAt));
      }

      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animFrameId.current = requestAnimationFrame(animate);
    };

    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [lightState, winnerTeam, zoomFactor]);

  const handleZoomIn = () => setZoomFactor(prev => Math.min(prev + 0.25, 2.2));
  const handleZoomOut = () => setZoomFactor(prev => Math.max(prev - 0.25, 0.65));
  const handleReset = () => setZoomFactor(1.0);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Camera & Above View Controls in Open Center Channel */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/80 shadow-xl text-xs font-semibold text-slate-200">
        <button
          onClick={() => onChangeCameraPreset && onChangeCameraPreset(cameraPreset === 'ABOVE' ? 'OVERVIEW' : 'ABOVE')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-black transition-all ${
            cameraPreset === 'ABOVE'
              ? 'bg-cyan-500 text-slate-950 shadow-md ring-1 ring-cyan-300'
              : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
          }`}
          title="Toggle Above View (Bird's-Eye View to see all contestants and track)"
        >
          <span>🚁 {cameraPreset === 'ABOVE' ? 'Above View Active' : 'Above View'}</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-0.5" />

        <button
          onClick={handleZoomIn}
          className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-md transition-all font-mono font-black"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-md transition-all font-mono font-black"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={handleReset}
          className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-md transition-all font-bold"
          title="Reset View"
        >
          ↺
        </button>
      </div>
    </div>
  );
};
