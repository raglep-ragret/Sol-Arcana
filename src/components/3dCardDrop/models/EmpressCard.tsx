import React, { useRef, useState } from "react";
import * as THREE from "three";
import { GLTF } from "three-stdlib";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";

useGLTF.preload("/empress-v1-transformed.glb");

type EmpressGLTFResult = GLTF & {
  nodes: {
    Plane_1: THREE.Mesh;
    Plane_2: THREE.Mesh;
  };
  materials: {
    FACE: THREE.MeshStandardMaterial;
    BACK: THREE.MeshStandardMaterial;
  };
};

type EmpressCardProps = {
  z: number;
};

type EmpressCardState = {
  x: number;
  y: number;
  rX: number;
  rY: number;
  rZ: number;
};

const EmpressCard = ({ z }: EmpressCardProps) => {
  const group = useRef<THREE.Group>();
  const { nodes, materials } = useGLTF(
    "/empress-v1-transformed.glb"
  ) as EmpressGLTFResult;

  const { camera, viewport } = useThree();
  const { height, width } = viewport.getCurrentViewport(
    camera,
    new THREE.Vector3(0, 0, z)
  );

  const [data] = useState<EmpressCardState>({
    x: THREE.MathUtils.randFloatSpread(2),
    y: THREE.MathUtils.randFloatSpread(height),
    rX: Math.random() * Math.PI,
    rY: Math.random() * Math.PI,
    rZ: Math.random() * Math.PI,
  });

  useFrame((_) => {
    if (group.current) {
      group.current.rotation.set(
        (data.rX += 0.003),
        (data.rY += 0.003),
        (data.rZ += 0.002)
      );
      group.current.position.set(data.x * width, (data.y -= 0.01), z);

      if (data.y < -height * 1.2) {
        data.x = THREE.MathUtils.randFloatSpread(2);
        data.y = height * 1.2;
      }
    }
  });

  return (
    <group ref={group} dispose={null}>
      <group scale={[0.8, 1, 1.2]}>
        <mesh geometry={nodes.Plane_1.geometry} material={materials.FACE} />
        <mesh geometry={nodes.Plane_2.geometry} material={materials.BACK} />
      </group>
    </group>
  );
};

export default EmpressCard;
