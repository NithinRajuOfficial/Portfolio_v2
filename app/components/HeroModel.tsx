"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export default function HeroModel() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const prefersReducedMotion = usePrefersReducedMotion();
  const prefersReducedMotionRef = useRef(prefersReducedMotion);

  useEffect(() => {
    prefersReducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    let disposed = false;
    let frameId = 0;

    const getSize = () => ({
      width: currentMount.clientWidth,
      height: currentMount.clientHeight,
    });

    const scene = new THREE.Scene();

    const { width: initialWidth, height: initialHeight } = getSize();

    const camera = new THREE.PerspectiveCamera(
      45,
      initialWidth / initialHeight || 1,
      0.1,
      1000,
    );

    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setSize(initialWidth, initialHeight);
    renderer.setClearColor(0x000000, 0);

    currentMount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5).normalize();
    scene.add(light);

    let mixer: THREE.AnimationMixer | null = null;
    let spinningModel: THREE.Object3D | null = null;

    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      if (mixer) mixer.update(clock.getDelta());

      if (spinningModel && !prefersReducedMotionRef.current) {
        spinningModel.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };

    animate();

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    loader.load(
      "/models/scene.glb",
      (gltf) => {
        if (disposed) return;

        const model = gltf.scene;

        model.scale.set(1.7, 1.7, 1.7);
        model.position.set(0, -1.5, 0);

        scene.add(model);
        spinningModel = model;

        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();
        }

        setIsLoading(false);
      },
      undefined,
      (error) => {
        console.error("An error occurred while loading the model", error);

        if (!disposed) setIsLoading(false);
      },
    );

    const handleResize = () => {
      const { width, height } = getSize();

      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(currentMount);

    return () => {
      disposed = true;

      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();

          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          materials.forEach((material) => {
            Object.values(material).forEach((value) => {
              if (value instanceof THREE.Texture) {
                value.dispose();
              }
            });

            material.dispose();
          });
        }
      });

      renderer.dispose();

      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className="absolute inset-y-0 right-0 w-1/2 hidden md:flex items-center justify-center z-20 pointer-events-none"
      ref={mountRef}
    >
      {isLoading && (
        <div
          className={`w-16 h-16 border-4 border-white/30 border-t-white rounded-full ${
            prefersReducedMotion ? "" : "animate-spin"
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
