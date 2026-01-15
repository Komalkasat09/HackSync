"use client";

import { useEffect, useRef, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Mic, Volume2 } from 'lucide-react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface AIAvatarInterviewerProps {
  isAsking: boolean;
  audioRef?: React.RefObject<HTMLAudioElement>;
}

function AvatarModel({ audioLevel, isSpeaking }: { audioLevel: number; isSpeaking: boolean }) {
  const modelRef = useRef<THREE.Group>(null);
  const [hasModel, setHasModel] = useState(false);

  // Load GLB model with proper error handling - use fallback by default
  let gltf: any = null;
  
  try {
    gltf = useGLTF('/avatar.glb');
    if (gltf?.scene) {
      setHasModel(true);
    }
  } catch (error) {
    console.warn('Avatar model unavailable, using fallback avatar');
    setHasModel(false);
  }
  
  const scene = gltf?.scene;

  useEffect(() => {
    if (!scene) {
      setHasModel(false);
      console.log('Avatar model not available, using fallback');
      return;
    }
    
    setHasModel(true);
    console.log('Avatar model loaded successfully');
    
    // Find mesh with morph targets for lip-sync
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).morphTargetInfluences) {
        const mesh = child as THREE.Mesh;
        console.log('Found morph targets:', mesh.morphTargetDictionary);
      }
    });
  }, [scene]);

  // Animate model based on audio
  useFrame((state) => {
    if (!modelRef.current) return;

    // Subtle idle animation
    if (!isSpeaking) {
      modelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      modelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    } else {
      // Speaking animation - more dynamic
      modelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
      modelRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.05;
    }

    // Animate morph targets for lip-sync (only if model is loaded)
    if (scene && hasModel) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).morphTargetInfluences) {
          const mesh = child as THREE.Mesh;
          const influences = mesh.morphTargetInfluences;
          
          if (influences && isSpeaking) {
            // Animate mouth open/close based on audio level
            // Adjust indices based on your model's morph targets
            influences[0] = audioLevel * 0.8; // Mouth open
            influences[1] = audioLevel * 0.5; // Jaw open
          } else if (influences) {
            // Close mouth when not speaking
            influences[0] = 0;
            influences[1] = 0;
          }
        }
      });
    }
  });

  // Fallback simple avatar if model fails to load
  // Fallback simple avatar if model fails to load
  if (!hasModel || !scene) {
    return (
      <group ref={modelRef}>
        <mesh>
          {/* Head */}
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial color="#0a7fff" opacity={0.8} transparent />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.18, 0.18, 0.5]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0.18, 0.18, 0.5]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
        </mesh>
        {/* Pupils */}
        <mesh position={[-0.18, 0.18, 0.58]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#0a7fff" />
        </mesh>
        <mesh position={[0.18, 0.18, 0.58]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#0a7fff" />
        </mesh>
        {/* Mouth - animated based on audio */}
        <mesh position={[0, -0.1, 0.5]} scale={[0.6, isSpeaking ? Math.max(0.2, audioLevel * 0.4) : 0.15, 1]}>
          <torusGeometry args={[0.12, 0.05, 16, 32, Math.PI]} />
          <meshStandardMaterial color="#0a7fff" emissive="#0a7fff" emissiveIntensity={isSpeaking ? 0.6 : 0.2} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={modelRef}>
      <primitive object={scene} scale={0.3} position={[0, -0.6, 0]} />
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#0a7fff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4a90ff" />
      <spotLight
        position={[0, 5, 0]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        castShadow
        color="#0a7fff"
      />
    </>
  );
}

export default function AIAvatarInterviewer({ isAsking, audioRef }: AIAvatarInterviewerProps) {
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Setup audio analysis when audio element is available
  useEffect(() => {
    if (!audioRef?.current) return;

    const setupAudioAnalysis = () => {
      try {
        if (audioContextRef.current) return; // Already setup
        
        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        // Create analyser
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        // Connect audio element to analyser
        const source = audioContext.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        console.log('Audio analysis setup complete');
      } catch (error) {
        console.error('Error setting up audio analysis:', error);
      }
    };

    // Setup on first play
    const handlePlay = () => {
      setupAudioAnalysis();
      setIsSpeaking(true);
      console.log('Audio started playing');
    };

    const handlePause = () => {
      setIsSpeaking(false);
      console.log('Audio paused');
    };
    
    const handleEnded = () => {
      setIsSpeaking(false);
      console.log('Audio ended');
    };

    const audio = audioRef.current;
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef]);

  // Analyze audio and update mouth movement
  useEffect(() => {
    if (!isSpeaking || !analyserRef.current) return;

    const analyseAudio = () => {
      const analyser = analyserRef.current;
      if (!analyser) return;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      // Calculate average volume from high frequency band (for voice detection)
      const highFreqStart = Math.floor(dataArray.length * 0.2);
      const highFreqEnd = Math.floor(dataArray.length * 0.8);
      let sum = 0;
      for (let i = highFreqStart; i < highFreqEnd; i++) {
        sum += dataArray[i];
      }
      const average = sum / (highFreqEnd - highFreqStart);
      const normalized = Math.min(average / 100, 1); // Normalize to 0-1

      setAudioLevel(normalized);
      animationFrameRef.current = requestAnimationFrame(analyseAudio);
    };

    analyseAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpeaking]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full h-[400px]"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        className="w-full h-full"
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <Lights />
          <AvatarModel audioLevel={audioLevel} isSpeaking={isSpeaking} />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Suspense>
      </Canvas>
      
      {/* Glow effect background */}
      {isSpeaking && (
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-[var(--shiny-blue)]/20 to-transparent pointer-events-none"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      )}
      
      {/* Status indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-[var(--glass-bg)] backdrop-blur-xl rounded-full border border-[var(--glass-border)]">
        {isSpeaking ? (
          <>
            <Volume2 className="w-4 h-4 text-[var(--shiny-blue)] animate-pulse" />
            <span className="text-sm text-[var(--shiny-blue)]">Speaking...</span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 h-3 bg-[var(--shiny-blue)] rounded-full"
                  animate={{
                    scaleY: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 text-foreground/60" />
            <span className="text-sm text-foreground/60">
              {isAsking ? 'Listening...' : 'Ready'}
            </span>
          </>
        )}
      </div>

      {/* Particle effects when speaking */}
      {isSpeaking && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-[var(--shiny-blue)]/40"
              initial={{
                x: '50%',
                y: '50%',
                scale: 0,
              }}
              animate={{
                x: `${50 + (Math.random() - 0.5) * 100}%`,
                y: `${50 + (Math.random() - 0.5) * 100}%`,
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
