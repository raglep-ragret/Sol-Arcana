import React, { Suspense } from "react";
import { Box } from "@chakra-ui/layout";
import { Canvas } from "@react-three/fiber";
import MagicianCard from "./models/MagicianCard";
import FoolCard from "./models/FoolCard";
import EmpressCard from "./models/EmpressCard";

const countEach = 10;
const depth = 20;

const ThreeDCardDrop = () => (
  <Box
    h="100vh"
    w="100vw"
    maxW="100%"
    position="absolute"
    top="0"
    left="0"
    zIndex={2}
  >
    <Canvas camera={{ near: 0.01, far: 110, fov: 30 }}>
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 10, 10]} intensity={2} />

      <Suspense fallback={null}>
        {Array.from({ length: countEach }, (_, index) => (
          <React.Fragment key={index}>
            <MagicianCard
              key={`magician-${index}`}
              z={-(index / countEach) * depth}
            />
            <FoolCard key={`fool-${index}`} z={-(index / countEach) * depth} />
            <EmpressCard
              key={`empress-${index}`}
              z={-(index / countEach) * depth}
            />
          </React.Fragment>
        ))}
      </Suspense>
    </Canvas>
  </Box>
);

export default ThreeDCardDrop;
