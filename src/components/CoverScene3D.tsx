import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { CoverGeometry, CoverPatternInput } from '../types/cover';

type CoverScene3DProps = {
  geometry: CoverGeometry;
  params: CoverPatternInput;
};

function leatherTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 384;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#7f4b2e';
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < 8000; index += 1) {
    const alpha = 0.08 + Math.random() * 0.15;
    context.fillStyle = `rgba(42,25,15,${alpha})`;
    context.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function panel(width: number, height: number, thickness: number, material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, thickness), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function CoverScene3D({ geometry, params }: CoverScene3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 2.25, 7.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);
    const texture = leatherTexture();
    const leather = new THREE.MeshPhysicalMaterial({
      color: '#8d5735',
      map: texture,
      roughness: 0.62,
      clearcoat: 0.22,
      sheen: 0.4,
      sheenColor: new THREE.Color('#c9976a'),
    });
    const lining = new THREE.MeshStandardMaterial({ color: '#b57b4e', roughness: 0.72 });
    const paper = new THREE.MeshStandardMaterial({ color: '#f2eadb', roughness: 0.9 });
    const edge = new THREE.MeshStandardMaterial({ color: '#2f1d12', roughness: 0.58 });

    const ratio = THREE.MathUtils.clamp(params.docHeightMm / params.docWidthMm, 1.15, 1.65);
    const panelWidth = 2.05;
    const panelHeight = panelWidth * ratio;
    const thickness = THREE.MathUtils.clamp(params.leatherThicknessMm / 10, 0.08, 0.22);
    const spineGap = THREE.MathUtils.clamp(params.spineWidthMm / Math.max(params.docWidthMm, 1), 0.04, 0.28);

    const leftPivot = new THREE.Group();
    const rightPivot = new THREE.Group();
    leftPivot.position.x = -spineGap / 2;
    rightPivot.position.x = spineGap / 2;
    root.add(leftPivot, rightPivot);

    const leftPanel = panel(panelWidth, panelHeight, thickness, leather);
    leftPanel.position.x = -panelWidth / 2;
    leftPivot.add(leftPanel);
    const rightPanel = panel(panelWidth, panelHeight, thickness, leather);
    rightPanel.position.x = panelWidth / 2;
    rightPivot.add(rightPanel);

    const leftPages = panel(panelWidth * 0.9, panelHeight * 0.91, 0.12, paper);
    leftPages.position.set(-panelWidth / 2 + 0.06, 0, thickness * 0.8);
    leftPivot.add(leftPages);
    const rightPages = panel(panelWidth * 0.9, panelHeight * 0.91, 0.12, paper);
    rightPages.position.set(panelWidth / 2 - 0.06, 0, thickness * 0.8);
    rightPivot.add(rightPages);

    if (params.hasInnerLining) {
      const leftLining = panel(panelWidth * 0.93, panelHeight * 0.93, 0.035, lining);
      leftLining.position.set(-panelWidth / 2, 0, thickness / 2 + 0.08);
      leftPivot.add(leftLining);
      const rightLining = panel(panelWidth * 0.93, panelHeight * 0.93, 0.035, lining);
      rightLining.position.set(panelWidth / 2, 0, thickness / 2 + 0.08);
      rightPivot.add(rightLining);
    }

    if (params.hasCardSlots && params.cardSlotCount > 0) {
      const slots = Math.min(params.cardSlotCount, 4);
      for (let index = 0; index < slots; index += 1) {
        const pocket = panel(0.78, 0.34, 0.05, lining);
        const side = index % 2 === 0 ? leftPivot : rightPivot;
        pocket.position.set(index % 2 === 0 ? -panelWidth / 2 : panelWidth / 2, 0.62 - Math.floor(index / 2) * 0.48, thickness / 2 + 0.16);
        side.add(pocket);
      }
    }

    const spine = new THREE.Mesh(new THREE.BoxGeometry(spineGap + 0.06, panelHeight, thickness * 1.05), edge);
    spine.position.z = -0.02;
    root.add(spine);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(11, 8), new THREE.ShadowMaterial({ color: '#3a291d', opacity: 0.17 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -panelHeight * 0.65;
    ground.receiveShadow = true;
    scene.add(ground);

    scene.add(new THREE.HemisphereLight('#fff8ed', '#554235', 1.4));
    const key = new THREE.DirectionalLight('#ffffff', 2.7);
    key.position.set(3.5, 5, 5);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.PointLight('#f2cda1', 1.2, 14);
    fill.position.set(-4, 2, 3);
    scene.add(fill);

    const resize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame = 0;
    let animation = 0;
    const animate = () => {
      frame += 0.009;
      const openAngle = 0.16 + (Math.sin(frame) + 1) * 0.12;
      leftPivot.rotation.y = openAngle;
      rightPivot.rotation.y = -openAngle;
      root.rotation.x = -0.18;
      root.rotation.y = Math.sin(frame * 0.55) * 0.12;
      renderer.render(scene, camera);
      animation = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animation);
      observer.disconnect();
      texture.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [geometry, params]);

  return <div ref={mountRef} className="h-[380px] w-full" aria-label="3D-превью обложки" />;
}
