import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { WalletPatternParams } from '../types/pattern';

type WalletScene3DProps = {
  params: WalletPatternParams;
};

/** Radial gradient canvas texture used for a soft contact shadow under the product. */
function makeContactShadow() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(40,28,18,0.42)');
  grad.addColorStop(0.55, 'rgba(40,28,18,0.18)');
  grad.addColorStop(1, 'rgba(40,28,18,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Procedural leather grain + subtle roughness variation. */
function makeLeatherTextures() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#8c5a36';
  ctx.fillRect(0, 0, size, size);
  // speckled pore pattern
  for (let i = 0; i < 14000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 1.4;
    const shade = Math.random() * 60 - 30;
    ctx.fillStyle = `rgba(${90 + shade},${58 + shade},${34 + shade},0.5)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1.4, 1);
  return map;
}

export function WalletScene3D({ params }: WalletScene3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 1.0, 7.8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    // Lightweight studio environment for crisp specular highlights.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color('#efe7da');
    const envLightTop = new THREE.Mesh(
      new THREE.SphereGeometry(12, 16, 16),
      new THREE.MeshBasicMaterial({ color: '#fff6e8', side: THREE.BackSide }),
    );
    envScene.add(envLightTop);
    const envPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    );
    envPanel.position.set(3, 5, 4);
    envPanel.lookAt(0, 0, 0);
    envScene.add(envPanel);
    const envTarget = pmrem.fromScene(envScene, 0.04);
    scene.environment = envTarget.texture;

    const group = new THREE.Group();
    scene.add(group);

    const leatherMap = makeLeatherTextures();
    const walletMaterial = new THREE.MeshPhysicalMaterial({
      color: '#9a6238',
      map: leatherMap,
      roughness: 0.62,
      metalness: 0.0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.5,
      sheen: 0.5,
      sheenColor: new THREE.Color('#caa074'),
      envMapIntensity: 0.9,
    });
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: '#33220f',
      roughness: 0.55,
      metalness: 0.0,
    });
    const pocketMaterial = new THREE.MeshPhysicalMaterial({
      color: '#b87f4f',
      roughness: 0.58,
      clearcoat: 0.25,
      envMapIntensity: 0.8,
    });

    // Rounded body via bevel-like layered box.
    const bodyGeometry = new THREE.BoxGeometry(4.6, 2.74, 0.3, 4, 4, 1);
    const body = new THREE.Mesh(bodyGeometry, walletMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Painted edge trim around the perimeter.
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(4.66, 2.8, 0.26),
      edgeMaterial,
    );
    trim.position.z = -0.02;
    group.add(trim);

    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.52, 0.36), edgeMaterial);
    spine.position.set(0, 0, 0.05);
    group.add(spine);

    const pockets = new THREE.Group();
    group.add(pockets);

    // Soft contact shadow plane.
    const shadowTex = makeContactShadow();
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 7),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.78;
    scene.add(shadowPlane);

    const ambient = new THREE.HemisphereLight('#fff6e8', '#5a4636', 1.1);
    scene.add(ambient);
    const key = new THREE.DirectionalLight('#ffffff', 2.4);
    key.position.set(3.6, 5.2, 4.4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 20;
    key.shadow.bias = -0.0004;
    scene.add(key);
    const fill = new THREE.DirectionalLight('#ffe9cf', 0.7);
    fill.position.set(-4, 1.5, 2);
    scene.add(fill);
    const rim = new THREE.PointLight('#fff1dc', 1.2, 14);
    rim.position.set(-3, 2.6, 3.5);
    scene.add(rim);

    function rebuildPockets() {
      pockets.clear();
      const pocketCount = paramsRef.current.pocketCount;
      const rows = Math.ceil(pocketCount / 2);
      const pocketWidth = 1.56;
      const pocketHeight = Math.max(0.42, Math.min(0.62, 1.6 / (rows + 1)));
      const gap = 0.18;

      Array.from({ length: pocketCount }, (_, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const pocket = new THREE.Mesh(new THREE.BoxGeometry(pocketWidth, pocketHeight, 0.09), pocketMaterial);
        pocket.position.set(column === 0 ? -1.18 : 1.18, 0.62 - row * (pocketHeight + gap), 0.22);
        pocket.castShadow = true;
        pockets.add(pocket);
      });
    }

    rebuildPockets();

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    let frame = 0;
    let lastPocketCount = paramsRef.current.pocketCount;
    let animationId = 0;

    const animate = () => {
      frame += 0.01;
      const next = paramsRef.current;
      const widthScale = THREE.MathUtils.lerp(group.scale.x, THREE.MathUtils.clamp(next.widthMm / 110, 0.78, 1.16), 0.05);
      const heightScale = THREE.MathUtils.lerp(group.scale.y, THREE.MathUtils.clamp(next.heightMm / 85, 0.78, 1.18), 0.05);
      group.scale.set(widthScale, heightScale, 1);
      group.rotation.y = Math.sin(frame) * 0.22;
      group.rotation.x = -0.07 + Math.sin(frame * 0.6) * 0.03;

      if (lastPocketCount !== next.pocketCount) {
        lastPocketCount = next.pocketCount;
        rebuildPockets();
      }

      renderer.render(scene, camera);
      animationId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      bodyGeometry.dispose();
      leatherMap.dispose();
      shadowTex.dispose();
      envTarget.texture.dispose();
      pmrem.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="h-[340px] w-full" aria-label="3D-превью изделия" />;
}
