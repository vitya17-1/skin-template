import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { BeltGeometry } from '../types/belt';

type BeltScene3DProps = {
  geometry: BeltGeometry;
};

function createLeatherTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 192;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#874f2d';
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < 5000; index += 1) {
    const shade = 55 + Math.random() * 45;
    context.fillStyle = `rgba(${shade},${shade * 0.62},${shade * 0.36},0.22)`;
    context.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  return texture;
}

function addBuckle(group: THREE.Group, x: number, height: number) {
  const material = new THREE.MeshStandardMaterial({ color: '#b8a16d', metalness: 0.82, roughness: 0.24 });
  const width = 0.72;
  const thickness = 0.075;
  const depth = 0.11;
  const parts = [
    { size: [width, thickness, depth], position: [x, height / 2, 0] },
    { size: [width, thickness, depth], position: [x, -height / 2, 0] },
    { size: [thickness, height, depth], position: [x - width / 2, 0, 0] },
    { size: [thickness, height, depth], position: [x + width / 2, 0, 0] },
  ];
  parts.forEach((part) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...(part.size as [number, number, number])), material);
    mesh.position.set(...(part.position as [number, number, number]));
    mesh.castShadow = true;
    group.add(mesh);
  });
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.045, 0.045), material);
  tongue.position.set(x + 0.28, 0, 0.08);
  tongue.rotation.z = -0.08;
  group.add(tongue);
}

export function BeltScene3D({ geometry }: BeltScene3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 2.5, 7.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    const texture = createLeatherTexture();
    const leather = new THREE.MeshPhysicalMaterial({
      color: '#8e5835',
      map: texture,
      roughness: 0.66,
      clearcoat: 0.24,
      clearcoatRoughness: 0.58,
      sheen: 0.35,
      sheenColor: new THREE.Color('#c99768'),
    });
    const edge = new THREE.MeshStandardMaterial({ color: '#2f1e12', roughness: 0.55 });

    const lengthScale = THREE.MathUtils.clamp(geometry.strap.lengthMm / 1180, 0.82, 1.18);
    const widthScale = THREE.MathUtils.clamp(geometry.strap.widthMm / 35, 0.72, 1.35);
    const body = new THREE.Mesh(new THREE.BoxGeometry(5.4 * lengthScale, 0.48 * widthScale, 0.13), leather);
    body.castShadow = true;
    group.add(body);
    const edgeBack = new THREE.Mesh(new THREE.BoxGeometry(5.46 * lengthScale, 0.51 * widthScale, 0.08), edge);
    edgeBack.position.z = -0.045;
    group.add(edgeBack);

    const left = -2.7 * lengthScale;
    addBuckle(group, left - 0.28, 0.82 * widthScale);

    const holeMaterial = new THREE.MeshStandardMaterial({ color: '#21150e', roughness: 0.8 });
    geometry.adjustmentHoles.forEach((hole) => {
      const normalizedX = hole.x / geometry.strap.lengthMm - 0.5;
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.17, 18), holeMaterial);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(normalizedX * 5.4 * lengthScale, 0, 0.04);
      group.add(mesh);
    });

    const keeper = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.62 * widthScale, 0.2), leather);
    keeper.position.set(left + 0.55, 0, 0.04);
    keeper.castShadow = true;
    group.add(keeper);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 7),
      new THREE.ShadowMaterial({ color: '#3a291d', opacity: 0.18 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.75;
    ground.receiveShadow = true;
    scene.add(ground);

    scene.add(new THREE.HemisphereLight('#fff8ed', '#5b4433', 1.35));
    const key = new THREE.DirectionalLight('#ffffff', 2.8);
    key.position.set(3, 5, 5);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.PointLight('#f2cda1', 1.4, 14);
    rim.position.set(-4, 2, 3);
    scene.add(rim);

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame = 0;
    let animation = 0;
    const animate = () => {
      frame += 0.008;
      group.rotation.x = -0.26 + Math.sin(frame * 0.7) * 0.025;
      group.rotation.y = Math.sin(frame) * 0.16;
      group.rotation.z = -0.035;
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
  }, [geometry]);

  return <div ref={mountRef} className="h-[360px] w-full" aria-label="3D-превью ремня" />;
}
