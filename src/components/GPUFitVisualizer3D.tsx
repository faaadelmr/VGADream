'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { parsePowerConnectors } from '@/utils/powerConnector';
import { CaseSpec, GPUSpec } from '@/types';

interface GPUFitVisualizer3DProps {
  gpu: GPUSpec;
  pcCase: CaseSpec;
  isCompatible: boolean;
  lengthMarginMm: number;
  riserSlotOffsetMm?: number;
  onRiserSlotOffsetChange?: (val: number) => void;
  userPsuWattage?: number;
  onUserPsuChange?: (wattage: number) => void;
}

// Dynamic parser to extract exact port types and counts from gpu.displayOutputs string
function parseDisplayOutputs(outputsStr: string): Array<{ type: 'DP' | 'HDMI' | 'USBC'; label: string }> {
  const ports: Array<{ type: 'DP' | 'HDMI' | 'USBC'; label: string }> = [];
  if (!outputsStr) return ports;

  const parts = outputsStr.split(',').map((s) => s.trim());

  parts.forEach((part) => {
    const match = part.match(/^(\d+)x\s+(.+)$/i);
    if (match) {
      const count = parseInt(match[1], 10);
      const name = match[2];

      let type: 'DP' | 'HDMI' | 'USBC' = 'DP';
      if (name.toUpperCase().includes('HDMI')) {
        type = 'HDMI';
      } else if (name.toUpperCase().includes('USB')) {
        type = 'USBC';
      }

      for (let i = 0; i < count; i++) {
        ports.push({ type, label: `${name} #${i + 1}` });
      }
    }
  });

  return ports;
}

export const GPUFitVisualizer3D: React.FC<GPUFitVisualizer3DProps> = ({
  gpu,
  pcCase,
  isCompatible,
  riserSlotOffsetMm = 50,
  onRiserSlotOffsetChange,
  userPsuWattage,
  onUserPsuChange
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const [autoRotate, setAutoRotate] = useState(false);
  const [mountType, setMountType] = useState<'horizontal' | 'vertical'>('horizontal');
  const [cameraPreset, setCameraPresetState] = useState<'iso' | 'side' | 'top' | 'front' | 'rear_io'>('iso');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 380;

    // 1. Scene Setup — Studio Ambient Environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1329); // Rich Deep Studio Dark Navy

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3500);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;

    // 5. Bright & Vibrant Studio Lighting Setup
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e1b4b, 1.8); // Sky & Ground Ambient Fill
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2); // Overall Brightness
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5); // Warm Key Sunlight
    keyLight.position.set(400, 600, 500);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Cyan Studio Fill Light from Front-Left
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
    fillLight.position.set(-300, 300, 300);
    scene.add(fillLight);

    // Magenta/Violet Edge Rim Light from Back-Right
    const rimLight = new THREE.DirectionalLight(0xc084fc, 3.0);
    rimLight.position.set(200, 400, -400);
    scene.add(rimLight);

    // Dedicated Point Light illuminating Rear IO Ports (-X side)
    const ioLight = new THREE.PointLight(0xf0abfc, 5, 500);
    ioLight.position.set(-100, 150, 150);
    scene.add(ioLight);

    // Case Chamber Glow Status Light
    const statusPointLight = new THREE.PointLight(isCompatible ? 0x10b981 : 0xf43f5e, 4, 700);
    statusPointLight.position.set(pcCase.maxGpuLengthMm / 2, pcCase.maxGpuSlotThickness * 30, pcCase.maxGpuHeightMm / 2);
    scene.add(statusPointLight);

    // 6. Vibrant Floor Grid Helper
    const gridHelper = new THREE.GridHelper(1200, 60, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // 7. REAL PHYSICAL AXES & CONSTANT CASE BLUEPRINT BOX (Standard Case Spec)
    const caseW = pcCase.maxGpuLengthMm;
    const caseH = pcCase.maxGpuSlotThickness * 20.32; // 1 slot = 20.32mm (PCIe spec)
    const caseD = pcCase.maxGpuHeightMm;

    // Check if GPU exceeds the blueprint box in current mount mode
    const isVerticalOutOfBounds = mountType === 'vertical' && (
      gpu.lengthMm > caseW ||
      (12 + gpu.heightMm) > caseH ||
      (riserSlotOffsetMm + 2) > caseD ||
      (riserSlotOffsetMm - gpu.thicknessMm) < 0
    );

    const isHorizontalOutOfBounds = mountType === 'horizontal' && (
      gpu.lengthMm > caseW ||
      gpu.thicknessMm > caseH ||
      gpu.heightMm > caseD
    );

    const currentIsCompatible = isCompatible && !isVerticalOutOfBounds && !isHorizontalOutOfBounds;

    const caseGroup = new THREE.Group();

    // Wireframe Outer Frame of PC Case Chamber (The Case Blueprint Limit Box)
    const caseGeo = new THREE.BoxGeometry(caseW, caseH, caseD);
    const caseEdges = new THREE.EdgesGeometry(caseGeo);
    const caseLineMat = new THREE.LineBasicMaterial({
      color: currentIsCompatible ? 0x06b6d4 : 0xf43f5e,
      linewidth: 2
    });
    const caseWireframe = new THREE.LineSegments(caseEdges, caseLineMat);
    caseWireframe.position.set(caseW / 2, caseH / 2, caseD / 2);
    caseGroup.add(caseWireframe);

    // Glass Acrylic Side Panel
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.12,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 1.0
    });
    const glassMesh = new THREE.Mesh(caseGeo, glassMat);
    glassMesh.position.set(caseW / 2, caseH / 2, caseD / 2);
    caseGroup.add(glassMesh);

    scene.add(caseGroup);

    // 8. REALISTIC HIGH-DETAIL GAMING MOTHERBOARD (ATX Form Factor) MOUNTED AT Z = 0
    const moboGroup = new THREE.Group();
    const moboW = Math.min(244, caseW - 10);
    const moboH = 305; // Standard ATX Motherboard Height (305mm)

    // In horizontal mode, top of GPU connects flush into PCIe slot at Y = caseH
    const moboPcieY = mountType === 'horizontal' ? caseH : 100;
    const moboPcieZ = 7;

    // A. Main Matte Black PCB Plate with Metallic Copper Traces
    const moboPcbGeo = new THREE.BoxGeometry(moboW, moboH, 5);
    const moboPcbMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.5, metalness: 0.3 });
    const moboPcbMesh = new THREE.Mesh(moboPcbGeo, moboPcbMat);
    // Center motherboard so PCIe slot sits at moboPcieY (slot 1 is ~110mm from top of mobo)
    moboPcbMesh.position.set(moboW / 2 + 5, moboPcieY - 42.5, -2.5);
    moboGroup.add(moboPcbMesh);

    // PCB Screw Mount Rings (4 corners)
    const screwPositions = [
      [15, moboPcieY - 180],
      [moboW - 10, moboPcieY - 180],
      [15, moboPcieY + 95],
      [moboW - 10, moboPcieY + 95]
    ];
    const screwMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    screwPositions.forEach(([sx, sy]) => {
      const screwGeo = new THREE.CylinderGeometry(3.5, 3.5, 5.5, 16);
      const screwMesh = new THREE.Mesh(screwGeo, screwMat);
      screwMesh.rotation.x = Math.PI / 2;
      screwMesh.position.set(sx, sy, -2.5);
      moboGroup.add(screwMesh);
    });

    // B. CPU Socket & Retention Frame (Positioned comfortably ABOVE PCIe Slot)
    const cpuSockX = moboW * 0.45;
    const cpuSockY = moboPcieY + 75; // Safely above GPU slot
    const cpuSockGeo = new THREE.BoxGeometry(45, 45, 4);
    const cpuSockMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.15 });
    const cpuSockMesh = new THREE.Mesh(cpuSockGeo, cpuSockMat);
    cpuSockMesh.position.set(cpuSockX, cpuSockY, 2);
    moboGroup.add(cpuSockMesh);

    // Gold Pin Array Center of CPU Socket
    const cpuPinCenterGeo = new THREE.BoxGeometry(32, 32, 4.5);
    const cpuPinCenterMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 });
    const cpuPinCenterMesh = new THREE.Mesh(cpuPinCenterGeo, cpuPinCenterMat);
    cpuPinCenterMesh.position.set(cpuSockX, cpuSockY, 2.2);
    moboGroup.add(cpuPinCenterMesh);

    // C. Massive VRM Aluminum Heatsink Blocks with RGB Strip
    const vrmTopGeo = new THREE.BoxGeometry(70, 22, 16);
    const vrmMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.85 });
    const vrmTopMesh = new THREE.Mesh(vrmTopGeo, vrmMat);
    vrmTopMesh.position.set(cpuSockX, cpuSockY + 36, 8);
    moboGroup.add(vrmTopMesh);

    const vrmLeftGeo = new THREE.BoxGeometry(22, 60, 16);
    const vrmLeftMesh = new THREE.Mesh(vrmLeftGeo, vrmMat);
    vrmLeftMesh.position.set(cpuSockX - 36, cpuSockY, 8);
    moboGroup.add(vrmLeftMesh);

    // RGB LED Accent Strip on VRM Heatsink
    const vrmRgbGeo = new THREE.BoxGeometry(66, 3, 17);
    const vrmRgbMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8 });
    const vrmRgbMesh = new THREE.Mesh(vrmRgbGeo, vrmRgbMat);
    vrmRgbMesh.position.set(cpuSockX, cpuSockY + 45, 8.5);
    moboGroup.add(vrmRgbMesh);

    // D. 4x DDR5 RAM Slots & RGB RAM Sticks Installed (Slots 2 & 4)
    const ramStartX = cpuSockX + 35;
    for (let slot = 0; slot < 4; slot++) {
      const rx = ramStartX + slot * 9;
      // RAM Slot Housing
      const slotGeo = new THREE.BoxGeometry(5, 75, 8);
      const slotMat = new THREE.MeshStandardMaterial({ color: slot % 2 === 0 ? 0x0f172a : 0x334155, roughness: 0.7 });
      const slotMesh = new THREE.Mesh(slotGeo, slotMat);
      slotMesh.position.set(rx, cpuSockY - 5, 4);
      moboGroup.add(slotMesh);

      // RAM Sticks with Heatsink & RGB Top Light Bar in Slots 2 & 4
      if (slot === 1 || slot === 3) {
        const ramStickGeo = new THREE.BoxGeometry(3.5, 72, 18);
        const ramStickMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.2, metalness: 0.9 });
        const ramStickMesh = new THREE.Mesh(ramStickGeo, ramStickMat);
        ramStickMesh.position.set(rx, cpuSockY - 5, 11);
        moboGroup.add(ramStickMesh);

        // RGB Lightbar on top of RAM stick
        const ramRgbGeo = new THREE.BoxGeometry(4, 72, 3);
        const ramRgbMat = new THREE.MeshStandardMaterial({
          color: slot === 1 ? 0x06b6d4 : 0xc084fc,
          emissive: slot === 1 ? 0x0891b2 : 0x9333ea,
          emissiveIntensity: 0.9
        });
        const ramRgbMesh = new THREE.Mesh(ramRgbGeo, ramRgbMat);
        ramRgbMesh.position.set(rx, cpuSockY - 5, 21);
        moboGroup.add(ramRgbMesh);
      }
    }

    // E. M.2 NVMe SSD Aluminum Heatsink Armor Shield (Between CPU & PCIe Slot)
    const m2Geo = new THREE.BoxGeometry(90, 20, 7);
    const m2Mat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.25, metalness: 0.88 });
    const m2Mesh = new THREE.Mesh(m2Geo, m2Mat);
    m2Mesh.position.set(70, moboPcieY - 35, 5.5);
    moboGroup.add(m2Mesh);

    // F. Chipset Heatsink Shield (Bottom Right Corner)
    const chipsetGeo = new THREE.BoxGeometry(60, 55, 10);
    const chipsetMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.85 });
    const chipsetMesh = new THREE.Mesh(chipsetGeo, chipsetMat);
    chipsetMesh.position.set(moboW - 35, moboPcieY - 120, 5);
    moboGroup.add(chipsetMesh);

    // G. Rear I/O Shroud Tower (Left Edge of Mobo, Safely above PCIe slot)
    const ioTowerGeo = new THREE.BoxGeometry(24, 75, 24);
    const ioTowerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.7 });
    const ioTowerMesh = new THREE.Mesh(ioTowerGeo, ioTowerMat);
    ioTowerMesh.position.set(15, moboPcieY + 50, 12);
    moboGroup.add(ioTowerMesh);

    // H. Steel Armored PCIe x16 Slot (Fixed position receiving GPU)
    const pcieSlotGeo = new THREE.BoxGeometry(135, 9, 14);
    const pcieSlotMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 });
    const pcieSlotMesh = new THREE.Mesh(pcieSlotGeo, pcieSlotMat);
    pcieSlotMesh.position.set(70, moboPcieY, moboPcieZ);
    moboGroup.add(pcieSlotMesh);

    // Inner Black Cavity & Gold Pins of PCIe Slot
    const pcieCavityGeo = new THREE.BoxGeometry(125, 4, 12);
    const pcieCavityMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.9 });
    const pcieCavityMesh = new THREE.Mesh(pcieCavityGeo, pcieCavityMat);
    pcieCavityMesh.position.set(70, moboPcieY, moboPcieZ + 1);
    moboGroup.add(pcieCavityMesh);

    // PCIe Retention Latch Clip on Right End
    const latchGeo = new THREE.BoxGeometry(12, 12, 12);
    const latchMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3, metalness: 0.7 });
    const latchMesh = new THREE.Mesh(latchGeo, latchMat);
    latchMesh.position.set(140, moboPcieY, moboPcieZ);
    moboGroup.add(latchMesh);

    // I. Array of Solid Capacitors along VRM Power Phase
    for (let c = 0; c < 8; c++) {
      const capGeo = new THREE.CylinderGeometry(2.5, 2.5, 6, 16);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.2 });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.rotation.x = Math.PI / 2;
      capMesh.position.set(cpuSockX - 22, cpuSockY - 25 + c * 7, 5);
      moboGroup.add(capMesh);
    }

    scene.add(moboGroup);

    // 9. BUILD DETAILED 3D GPU MODEL
    const gpuGroup = new THREE.Group();
    const gpuW = gpu.lengthMm; // Length
    const gpuH = gpu.thicknessMm; // Slot Thickness
    const gpuD = gpu.heightMm; // Card Height / Depth

    const brandColorHex = gpu.accentColor ? parseInt(gpu.accentColor.replace('#', '0x'), 16) : 0x3b82f6;

    // Main Metallic GPU Shroud Box
    const shroudGeo = new THREE.BoxGeometry(gpuW, gpuH, gpuD);
    const shroudMat = new THREE.MeshStandardMaterial({
      color: isCompatible ? brandColorHex : 0xbe123c,
      roughness: 0.35,
      metalness: 0.75
    });
    const shroudMesh = new THREE.Mesh(shroudGeo, shroudMat);
    shroudMesh.position.set(gpuW / 2, gpuH / 2, gpuD / 2);
    shroudMesh.castShadow = true;
    shroudMesh.receiveShadow = true;
    gpuGroup.add(shroudMesh);

    // Metallic Heatsink Fins (Exposed Sides)
    const heatsinkGeo = new THREE.BoxGeometry(gpuW - 16, gpuH - 6, gpuD - 12);
    const heatsinkMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.9 });
    const heatsinkMesh = new THREE.Mesh(heatsinkGeo, heatsinkMat);
    heatsinkMesh.position.set(gpuW / 2, gpuH / 2, gpuD / 2);
    gpuGroup.add(heatsinkMesh);

    // Metal Backplate — on the TOP face (PCB back side, Y = gpuH + 1)
    const backplateGeo = new THREE.BoxGeometry(gpuW - 4, 2, gpuD - 2);
    const backplateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.85 });
    const backplateMesh = new THREE.Mesh(backplateGeo, backplateMat);
    backplateMesh.position.set(gpuW / 2, gpuH + 1, gpuD / 2); // Y=gpuH+1 = top/PCB back face
    gpuGroup.add(backplateMesh);

    // Cooling Fans — clearly on BOTTOM face (-Y) of shroud (facing down in horizontal mode)
    const numFans = gpuW > 250 ? 3 : 2;
    const fanRadius = Math.min(gpuD * 0.32, (gpuW / (numFans + 1)) * 0.42);
    const fanSpacing = gpuW / (numFans + 1);
    const fanBottomY = -2; // clearly below the shroud bottom face

    for (let i = 1; i <= numFans; i++) {
      const fanX = i * fanSpacing;
      const fanZ = gpuD / 2;

      // Fan housing ring — sits on bottom face of shroud
      const fanHousingGeo = new THREE.CylinderGeometry(fanRadius, fanRadius, 4, 32);
      const fanHousingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.7 });
      const fanHousingMesh = new THREE.Mesh(fanHousingGeo, fanHousingMat);
      fanHousingMesh.position.set(fanX, fanBottomY, fanZ);
      gpuGroup.add(fanHousingMesh);

      // Fan blade disk (dark)
      const fanDiskGeo = new THREE.CylinderGeometry(fanRadius * 0.88, fanRadius * 0.88, 2, 24);
      const fanDiskMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.4, metalness: 0.3 });
      const fanDiskMesh = new THREE.Mesh(fanDiskGeo, fanDiskMat);
      fanDiskMesh.position.set(fanX, fanBottomY - 1, fanZ);
      gpuGroup.add(fanDiskMesh);

      // Fan hub (center)
      const hubGeo = new THREE.CylinderGeometry(fanRadius * 0.18, fanRadius * 0.18, 3, 16);
      const hubMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.8 });
      const hubMesh = new THREE.Mesh(hubGeo, hubMat);
      hubMesh.position.set(fanX, fanBottomY - 1.5, fanZ);
      gpuGroup.add(hubMesh);

      // Fan blades (9 radial blades visible from bottom)
      const bladeCount = 9;
      for (let b = 0; b < bladeCount; b++) {
        const angle = (b / bladeCount) * Math.PI * 2;
        const bladeGeo = new THREE.BoxGeometry(fanRadius * 0.62, 1.5, fanRadius * 0.18);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.5 });
        const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
        bladeMesh.position.set(
          fanX + Math.cos(angle) * fanRadius * 0.52,
          fanBottomY - 1,
          fanZ + Math.sin(angle) * fanRadius * 0.52
        );
        bladeMesh.rotation.y = angle;
        gpuGroup.add(bladeMesh);
      }
    }

    // Rear Metal PCIe IO Expansion Bracket (-X side) — Realistic Brushed Stainless Steel PCIe Plate
    const bracketGroup = new THREE.Group();
    const bracketThickness = 1.4;
    const bracketH = gpuH + 2;
    const bracketD = gpuD + 4;

    // Main Brushed Stainless Steel Bracket Plate
    const bracketGeo = new THREE.BoxGeometry(bracketThickness, bracketH, bracketD);
    const bracketMat = new THREE.MeshStandardMaterial({
      color: 0xc0c6d0,
      metalness: 0.92,
      roughness: 0.18
    });
    const bracketMesh = new THREE.Mesh(bracketGeo, bracketMat);
    bracketMesh.position.set(-bracketThickness / 2, gpuH / 2, gpuD / 2);
    bracketGroup.add(bracketMesh);

    // Top Chassis Screw Mounting Lock Tab (L-Bracket fold)
    const tabGeo = new THREE.BoxGeometry(10, 1.4, 16);
    const tabMesh = new THREE.Mesh(tabGeo, bracketMat);
    tabMesh.position.set(-4.5, gpuH + 0.7, gpuD / 2);
    bracketGroup.add(tabMesh);

    // Thumbscrew Hole on Top Tab
    const holeGeo = new THREE.CylinderGeometry(2.2, 2.2, 2.0, 16);
    const holeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const holeMesh = new THREE.Mesh(holeGeo, holeMat);
    holeMesh.position.set(-5.5, gpuH + 0.7, gpuD / 2);
    bracketGroup.add(holeMesh);

    // Airflow Heat Exhaust Ventilation Slot Grills (Vertical Mesh Cutouts on upper section)
    const ventCount = Math.min(8, Math.floor(gpuD / 16));
    const ventStartY = gpuH * 0.78;
    const ventStartZ = gpuD * 0.18;
    const ventStepZ = (gpuD * 0.64) / Math.max(1, ventCount - 1);

    for (let v = 0; v < ventCount; v++) {
      const ventZ = ventStartZ + v * ventStepZ;
      const ventGeo = new THREE.BoxGeometry(1.6, Math.min(12, gpuH * 0.35), 3.0);
      const ventMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.9 });
      const ventMesh = new THREE.Mesh(ventGeo, ventMat);
      ventMesh.position.set(-bracketThickness / 2, ventStartY, ventZ);
      bracketGroup.add(ventMesh);
    }

    gpuGroup.add(bracketGroup);

    // HIGH-PRECISION 3D PHYSICAL DISPLAY PORTS (DP / HDMI / USB-C)
    const parsedPorts = parseDisplayOutputs(gpu.displayOutputs);
    const totalPorts = parsedPorts.length || 4;

    const startZ = gpuD * 0.20;
    const endZ = gpuD * 0.80;
    const stepZ = (endZ - startZ) / Math.max(1, totalPorts - 1);
    const portY = gpuH * 0.38; // Ports positioned neatly in the lower/middle row of bracket

    parsedPorts.forEach((port, idx) => {
      const zPos = totalPorts === 1 ? gpuD * 0.5 : startZ + idx * stepZ;

      if (port.type === 'DP') {
        // DisplayPort: Silver metallic outer shield with notched top-right corner
        const shieldGeo = new THREE.BoxGeometry(3.5, 6.2, 11.0);
        const shieldMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
        const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        shieldMesh.position.set(-1.8, portY, zPos);
        gpuGroup.add(shieldMesh);

        // Recessed Dark Inner Cavity
        const socketGeo = new THREE.BoxGeometry(3.6, 4.5, 9.2);
        const socketMat = new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.9 });
        const socketMesh = new THREE.Mesh(socketGeo, socketMat);
        socketMesh.position.set(-1.9, portY, zPos);
        gpuGroup.add(socketMesh);

        // DP Plastic Insulation Tongue (Cyan Accent)
        const tongueGeo = new THREE.BoxGeometry(2.0, 1.2, 7.5);
        const tongueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.4 });
        const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
        tongueMesh.position.set(-1.9, portY + 1.1, zPos);
        gpuGroup.add(tongueMesh);

        // Gold Pins on Tongue
        const pinGeo = new THREE.BoxGeometry(1.5, 0.5, 6.5);
        const pinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 });
        const pinMesh = new THREE.Mesh(pinGeo, pinMat);
        pinMesh.position.set(-1.9, portY + 0.6, zPos);
        gpuGroup.add(pinMesh);

        // Cyan LED Rim Glow around DP Port
        const glowGeo = new THREE.BoxGeometry(0.5, 7.2, 12.0);
        const glowMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0284c7, emissiveIntensity: 0.7 });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        glowMesh.position.set(-0.2, portY, zPos);
        gpuGroup.add(glowMesh);

      } else if (port.type === 'HDMI') {
        // HDMI Port: Trapezoidal Silver Metallic Shield
        const shieldGeo = new THREE.BoxGeometry(3.5, 5.5, 13.0);
        const shieldMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 });
        const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        shieldMesh.position.set(-1.8, portY, zPos);
        gpuGroup.add(shieldMesh);

        // Recessed Dark Inner Cavity
        const socketGeo = new THREE.BoxGeometry(3.6, 3.8, 11.2);
        const socketMat = new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.9 });
        const socketMesh = new THREE.Mesh(socketGeo, socketMat);
        socketMesh.position.set(-1.9, portY, zPos);
        gpuGroup.add(socketMesh);

        // HDMI Plastic Tongue (Amber/Gold Accent)
        const tongueGeo = new THREE.BoxGeometry(2.0, 1.0, 9.5);
        const tongueMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.4 });
        const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
        tongueMesh.position.set(-1.9, portY, zPos);
        gpuGroup.add(tongueMesh);

        // Gold Pins
        const pinGeo = new THREE.BoxGeometry(1.5, 0.4, 8.5);
        const pinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 });
        const pinMesh = new THREE.Mesh(pinGeo, pinMat);
        pinMesh.position.set(-1.9, portY - 0.4, zPos);
        gpuGroup.add(pinMesh);

        // Amber LED Rim Glow around HDMI Port
        const glowGeo = new THREE.BoxGeometry(0.5, 6.5, 14.0);
        const glowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.8 });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        glowMesh.position.set(-0.2, portY, zPos);
        gpuGroup.add(glowMesh);

      } else if (port.type === 'USBC') {
        // USB-C Port: Oval Metallic Shield
        const shieldGeo = new THREE.BoxGeometry(3.5, 4.0, 8.0);
        const shieldMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
        const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        shieldMesh.position.set(-1.8, portY, zPos);
        gpuGroup.add(shieldMesh);

        // Dark Socket Cavity
        const socketGeo = new THREE.BoxGeometry(3.6, 2.6, 6.5);
        const socketMat = new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.9 });
        const socketMesh = new THREE.Mesh(socketGeo, socketMat);
        socketMesh.position.set(-1.9, portY, zPos);
        gpuGroup.add(socketMesh);

        // Center Tongue
        const tongueGeo = new THREE.BoxGeometry(2.0, 0.8, 5.0);
        const tongueMat = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.3 });
        const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
        tongueMesh.position.set(-1.9, portY, zPos);
        gpuGroup.add(tongueMesh);

        // Magenta Glow Rim
        const glowGeo = new THREE.BoxGeometry(0.5, 4.8, 9.0);
        const glowMat = new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 0.8 });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        glowMesh.position.set(-0.2, portY, zPos);
        gpuGroup.add(glowMesh);
      }
    });

    // Gold PCIe Interface Connector Pins (near PCB on top side)
    const pcieGoldGeo = new THREE.BoxGeometry(75, 2, 10);
    const pcieGoldMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 });
    const pcieGoldMesh = new THREE.Mesh(pcieGoldGeo, pcieGoldMat);
    pcieGoldMesh.position.set(65, gpuH * 0.85, -5);
    gpuGroup.add(pcieGoldMesh);

    // DYNAMIC & REALISTIC 3D POWER CONNECTORS (MOUNTED FLUSH ON PCB EDGE, VISIBLE AT TOP CORNER)
    const pwrSpec = parsePowerConnectors(gpu.powerConnector);
    const pwrGroup = new THREE.Group();

    // 1. Calculate total width of all socket items
    const socketWidths = pwrSpec.items.map((item) =>
      item.type === '12VHPWR' ? 18 : item.type === '6-pin' ? 11 : 14
    );
    const socketGap = 2.5;
    const totalPwrWidth = socketWidths.reduce((a, b) => a + b, 0) + (pwrSpec.items.length - 1) * socketGap;

    // 2. Position X: Right at the CORNER of PCB end (X near gpuW - totalPwrWidth - 10)
    const pwrStartX = Math.max(10, gpuW - totalPwrWidth - 10);


    // 4. Render each socket flush on PCB edge (Z = gpuD + 1 to prevent mesh occlusion)
    let currentX = pwrStartX;

    pwrSpec.items.forEach((item, idx) => {
      const sockW = socketWidths[idx];
      const sockH = item.type === '12VHPWR' ? 7.5 : 9.0;
      const sockD = 9.0;

      const sockX = currentX + sockW / 2;
      // Position LOWER down: top of socket is at Y = gpuH - 1.5 (below top edge of shroud)
      const sockY = gpuH - 1.5 - sockH / 2;
      const sockZ = gpuD + 1;             // flush on front edge (+Z) so visible to camera

      // Outer Black Socket Housing Body
      const sockBodyGeo = new THREE.BoxGeometry(sockW, sockH, sockD);
      const sockBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.2 });
      const sockBodyMesh = new THREE.Mesh(sockBodyGeo, sockBodyMat);
      sockBodyMesh.position.set(sockX, sockY, sockZ);
      pwrGroup.add(sockBodyMesh);

      // Recessed Inner Chamber Cavity (Facing +Z towards camera)
      const cavityGeo = new THREE.BoxGeometry(sockW - 2.0, sockH - 2.0, 3.5);
      const cavityMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.9 });
      const cavityMesh = new THREE.Mesh(cavityGeo, cavityMat);
      cavityMesh.position.set(sockX, sockY, sockZ + sockD / 2 - 1.2);
      pwrGroup.add(cavityMesh);

      // Pin Cavities & Metallic Pins (2 rows x cols)
      const rows = 2;
      const cols = item.cols;
      const pinW = 1.0;
      const pinH = 1.0;
      const pinD = 2.5;
      const pinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 });

      const colStep = (sockW - 3.5) / cols;
      const rowStep = (sockH - 3.5) / rows;

      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const pinGeo = new THREE.BoxGeometry(pinW, pinH, pinD);
          const pinMesh = new THREE.Mesh(pinGeo, pinMat);
          const px = sockX - (sockW - 3.5) / 2 + colStep / 2 + col * colStep;
          const py = sockY - (sockH - 3.5) / 2 + rowStep / 2 + r * rowStep;
          const pz = sockZ + sockD / 2 - 1.5;
          pinMesh.position.set(px, py, pz);
          pwrGroup.add(pinMesh);
        }
      }

      // Sense Pins Header for 12VHPWR (4 small sense pins)
      if (item.hasSense) {
        const senseBandGeo = new THREE.BoxGeometry(13, 1.8, sockD - 1);
        const senseBandMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
        const senseBandMesh = new THREE.Mesh(senseBandGeo, senseBandMat);
        senseBandMesh.position.set(sockX, sockY + sockH / 2 + 0.9, sockZ);
        pwrGroup.add(senseBandMesh);

        const sensePinMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.2 });
        for (let sp = 0; sp < 4; sp++) {
          const spGeo = new THREE.BoxGeometry(0.8, 0.8, 2.0);
          const spMesh = new THREE.Mesh(spGeo, sensePinMat);
          const spX = sockX - 4.5 + sp * 3.0;
          spMesh.position.set(spX, sockY + sockH / 2 + 0.9, sockZ + sockD / 2 - 1.5);
          pwrGroup.add(spMesh);
        }
      }

      // Latch Hook Clip on Top of Socket
      const latchW = Math.min(5, sockW - 3);
      const latchGeo = new THREE.BoxGeometry(latchW, 1.2, 5);
      const latchMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
      const latchMesh = new THREE.Mesh(latchGeo, latchMat);
      latchMesh.position.set(sockX, sockY + sockH / 2 + (item.hasSense ? 1.8 : 0.6), sockZ);
      pwrGroup.add(latchMesh);

      currentX += sockW + socketGap;
    });

    gpuGroup.add(pwrGroup);

    // 10. ORIENTATION & RISER CABLE IMPLEMENTATION FOR MOUNT TYPES:
    if (mountType === 'horizontal') {
      // Standard Horizontal PCIe Mount — top of GPU connects flush into PCIe slot
      gpuGroup.position.set(2, moboPcieY - gpuH, 8);
      scene.add(gpuGroup);
    } else {
      // VERTICAL RISER CABLE MOUNT
      gpuGroup.rotation.x = -Math.PI / 2;

      // Position GPU vertically inside constant case chamber:
      // X = 2 (flush near rear I/O wall)
      // Y = 12 (bottom edge rests right inside top slot of floor riser socket at Y = 10)
      // Z = vertZ (shroud face at vertZ, backplate at vertZ - gpuH)
      const gpuX = 2;
      const vertY = 12;
      const vertZ = Math.max(50, riserSlotOffsetMm);
      gpuGroup.position.set(gpuX, vertY, vertZ);
      scene.add(gpuGroup);

      // RISER BASE SOCKET RESTING FLAT ON THE CASE FLOOR (Y = 0 to Y = 10) RECEIVING GPU GOLD PINS
      const riserSocketX = gpuX + 65;
      const riserSocketY = 5; // Socket center Y = 5, top face Y = 10 (receiving GPU gold pins at Y = 7!)
      const riserSocketZ = vertZ - gpuH * 0.85; // EXACT Z coordinate of GPU gold pins in rotated space

      const riserGroup = new THREE.Group();

      // Metallic Riser Socket Base resting flat on the floor receiving GPU gold pins
      const riserSocketGeo = new THREE.BoxGeometry(110, 10, 16);
      const riserSocketMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.95, roughness: 0.1 });
      const riserSocketMesh = new THREE.Mesh(riserSocketGeo, riserSocketMat);
      riserSocketMesh.position.set(riserSocketX, riserSocketY, riserSocketZ);
      riserGroup.add(riserSocketMesh);

      // Inner Gold Slot inside Riser Socket Base
      const riserSlotGeo = new THREE.BoxGeometry(92, 3, 6);
      const riserSlotMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 });
      const riserSlotMesh = new THREE.Mesh(riserSlotGeo, riserSlotMat);
      riserSlotMesh.position.set(riserSocketX, riserSocketY + 4, riserSocketZ);
      riserGroup.add(riserSlotMesh);

      // FLEXIBLE 3D PCIE RISER RIBBON CABLE RUNNING FLAT ALONG THE BOTTOM FLOOR
      const cableDepthZ = Math.max(10, riserSocketZ - moboPcieZ);
      const ribbonBottomGeo = new THREE.BoxGeometry(85, 3, cableDepthZ);
      const ribbonBottomMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.6, metalness: 0.4 });
      const ribbonBottomMesh = new THREE.Mesh(ribbonBottomGeo, ribbonBottomMat);
      ribbonBottomMesh.position.set(riserSocketX, 2, moboPcieZ + cableDepthZ / 2);
      riserGroup.add(ribbonBottomMesh);

      const cableHeightY = Math.max(4, moboPcieY - 2);
      const ribbonUpGeo = new THREE.BoxGeometry(85, cableHeightY, 3);
      const ribbonUpMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.6, metalness: 0.4 });
      const ribbonUpMesh = new THREE.Mesh(ribbonUpGeo, ribbonUpMat);
      ribbonUpMesh.position.set(riserSocketX, 2 + cableHeightY / 2, moboPcieZ);
      riserGroup.add(ribbonUpMesh);

      // Gold Trace Lines along the PCIe Ribbon Cable surface
      const goldLinesGeo = new THREE.BoxGeometry(80, cableHeightY - 2, 1);
      const goldLinesMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 });
      const goldLinesMesh = new THREE.Mesh(goldLinesGeo, goldLinesMat);
      goldLinesMesh.position.set(riserSocketX, 2 + cableHeightY / 2, moboPcieZ + 1.6);
      riserGroup.add(goldLinesMesh);

      scene.add(riserGroup);
    }

    // 11. Camera Orbit Position & Focus Setup
    const centerX = caseW / 2;
    const centerY = caseH / 2;
    const centerZ = caseD / 2;

    controls.target.set(centerX, centerY, centerZ);

    camera.position.set(centerX + caseW * 0.9, centerY + caseW * 0.6, centerZ + caseD * 2.2);
    controls.update();

    // 12. Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 380;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [gpu, pcCase, isCompatible, autoRotate, mountType, riserSlotOffsetMm]);

  // Camera Presets
  const setCameraPreset = (view: 'iso' | 'side' | 'top' | 'front' | 'rear_io') => {
    setCameraPresetState(view);
    if (!controlsRef.current || !cameraRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    const caseW = pcCase.maxGpuLengthMm;
    const caseH = mountType === 'horizontal'
      ? Math.max(gpu.thicknessMm + 20, pcCase.maxGpuSlotThickness * 25)
      : Math.max(gpu.heightMm + 40, 160);

    const caseD = mountType === 'horizontal'
      ? pcCase.maxGpuHeightMm
      : Math.max(gpu.thicknessMm + 50, 110);

    const centerX = caseW / 2;
    const centerY = caseH / 2;
    const centerZ = caseD / 2;

    if (view === 'iso') {
      camera.up.set(0, 1, 0);
      controls.target.set(centerX, centerY, centerZ);
      camera.position.set(centerX + caseW * 0.9, centerY + caseW * 0.6, centerZ + caseD * 2.2);
    } else if (view === 'side') {
      // Side view: looking from Z+ direction, showing GPU length × slot thickness
      // Shows the thin profile / depth of the GPU from the front face
      camera.up.set(0, 1, 0);
      controls.target.set(centerX, centerY, centerZ);
      camera.position.set(centerX, centerY, centerZ + caseD * 2.8);
    } else if (view === 'top') {
      // TOP VIEW: camera above (+Y), looking straight DOWN at the GPU FACE (XZ plane)
      // camera.up = (0,0,1) → Z-axis = card height goes UP in screen
      // → gold PCIe pins (low Z) appear at BOTTOM  ✓
      // → fans (on +Y face) visible as circles       ✓
      // → bracket (left X) on LEFT                   ✓
      const gpuFaceY = mountType === 'horizontal'
        ? caseH - gpu.thicknessMm / 2  // horizontal: GPU near top of case
        : caseH / 2;                    // vertical: GPU centered
      camera.up.set(0, 0, 1); // card height (Z) goes UP in screen
      controls.target.set(centerX, gpuFaceY, centerZ);
      camera.position.set(centerX, gpuFaceY + caseW * 1.6, centerZ);
    } else if (view === 'front') {
      camera.up.set(0, 1, 0);
      controls.target.set(centerX, centerY, centerZ);
      camera.position.set(centerX + caseW * 1.6, centerY, centerZ);
    } else if (view === 'rear_io') {
      // Focus directly on Rear IO Metal Bracket Ports
      camera.up.set(0, 1, 0);
      const targetX = 0;
      const targetY = mountType === 'horizontal' ? caseH - gpu.thicknessMm / 2 : gpu.heightMm / 2 + 10;
      const targetZ = mountType === 'horizontal' ? centerZ : Math.max(10, riserSlotOffsetMm);
      controls.target.set(targetX, targetY, targetZ);
      camera.position.set(-caseW * 0.85, targetY + 10, targetZ + 15);
    }
    controls.update();
  };

  return (
    <div className="relative w-full h-90 sm:h-105 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top-Left Compact Configurator (PSU always, Riser slider ONLY when Vertical Mount) */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2.5 bg-slate-900/90 border border-slate-800 p-1.5 px-2.5 rounded-xl backdrop-blur-md text-xs font-mono">
        {/* PCIe Riser Slider (ONLY when 3D Vertical Mount is selected) */}
        {mountType === 'vertical' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1">
                🔌 Riser:
              </span>
              <input
                type="range"
                min="50"
                max="130"
                step="5"
                value={riserSlotOffsetMm}
                onChange={(e) => onRiserSlotOffsetChange?.(Number(e.target.value))}
                className="w-20 sm:w-24 accent-cyan-400 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] font-bold text-cyan-400 w-10 text-right">
                {riserSlotOffsetMm}mm
              </span>
            </div>
            <div className="w-px h-3.5 bg-slate-800" />
          </>
        )}

        {/* User PSU Calculator */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-amber-400 font-bold uppercase">⚡ PSU:</span>
          <input
            type="number"
            min={300}
            max={1600}
            step={50}
            value={userPsuWattage || 750}
            onChange={(e) => onUserPsuChange?.(Number(e.target.value))}
            className="w-14 px-1 py-0.5 bg-slate-950 border border-slate-700 rounded text-[10px] font-bold text-amber-400 focus:outline-none focus:border-amber-500 text-center"
          />
          <span className="text-[10px] text-slate-400">W</span>
          {userPsuWattage !== undefined && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                (userPsuWattage - gpu.recommendedPsuW) >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {(userPsuWattage - gpu.recommendedPsuW) >= 0
                ? `+${userPsuWattage - gpu.recommendedPsuW}W`
                : `${userPsuWattage - gpu.recommendedPsuW}W`}
            </span>
          )}
        </div>
      </div>

      {/* Display Outputs Info & Layout Switcher (Top Right) */}
      <div className="absolute top-3 right-3 z-10 bg-slate-900/90 border border-slate-800 p-2 rounded-xl backdrop-blur-md text-xs font-mono flex flex-col items-end gap-1">
        <div className="text-[11px] text-fuchsia-300 font-bold flex items-center gap-1">
          <span>Display Outputs:</span>
          <span>{gpu.displayOutputs}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <button
            onClick={() => setMountType('horizontal')}
            className={`px-2 py-0.5 rounded text-[10px] transition-all ${
              mountType === 'horizontal' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Horizontal
          </button>
          <button
            onClick={() => setMountType('vertical')}
            className={`px-2.5 py-0.5 rounded text-[10px] transition-all flex items-center gap-1 ${
              mountType === 'vertical' ? 'bg-fuchsia-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Vertical (PCIe Riser)</span>
          </button>
        </div>
      </div>

      {/* Floating Out-of-Bounds Warning Overlay for Vertical Mount */}
      {mountType === 'vertical' && (12 + gpu.heightMm) > pcCase.maxGpuSlotThickness * 20.32 && (
        <div className="absolute bottom-16 left-3 z-10 bg-rose-950/95 border border-rose-500/80 p-2.5 px-3.5 rounded-xl backdrop-blur-md text-xs font-mono text-rose-200 font-bold flex items-center gap-2 shadow-2xl animate-pulse">
          <span className="text-rose-400 font-extrabold text-sm">❌ VERTICAL FIT OUT-OF-BOUNDS:</span>
          <span>
            GPU Height ({gpu.heightMm}mm) exceeds case blueprint height ({(pcCase.maxGpuSlotThickness * 20.32).toFixed(1)}mm) by +{((12 + gpu.heightMm) - (pcCase.maxGpuSlotThickness * 20.32)).toFixed(1)}mm!
          </span>
        </div>
      )}

      {/* Unified 3D Controls Bar (Bottom Overlay) */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs font-mono">
        {/* Left Controls: 3D Camera View Presets */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl backdrop-blur-md">
          <span className="text-[10px] text-cyan-400 font-bold px-2 uppercase">3D Camera:</span>
          <button
            onClick={() => setCameraPreset('iso')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              cameraPreset === 'iso' ? 'bg-cyan-600 text-white font-bold shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            3D Isometric
          </button>
          <button
            onClick={() => setCameraPreset('side')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              cameraPreset === 'side' ? 'bg-cyan-600 text-white font-bold shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Side View
          </button>
          <button
            onClick={() => setCameraPreset('top')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              cameraPreset === 'top' ? 'bg-cyan-600 text-white font-bold shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Top View
          </button>
        </div>

        {/* Right Controls: Auto Rotate & Rear I/O Display Ports */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl backdrop-blur-md">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1 rounded-lg transition-all font-bold ${
              autoRotate ? 'bg-cyan-600 text-white shadow' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {autoRotate ? 'Auto Rotate: ON' : 'Auto Rotate: OFF'}
          </button>
          <button
            onClick={() => setCameraPreset('rear_io')}
            className={`px-3 py-1 rounded-lg transition-all font-bold ${
              cameraPreset === 'rear_io'
                ? 'bg-fuchsia-600 text-white shadow'
                : 'bg-slate-800 text-fuchsia-400 hover:text-white'
            }`}
          >
            <span>Rear I/O Display Ports 🔌</span>
          </button>
        </div>
      </div>
    </div>
  );
};
