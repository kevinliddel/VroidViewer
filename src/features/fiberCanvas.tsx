import { Grid } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Vector3 } from 'three';
import { useModelStore } from '../store/useModelStore';
import { ModelSelector } from '../components/selector';
import useControls from 'r3f-native-orbitcontrols';
import { MenusContainer } from '../components/menus';
import * as THREE from 'three';

const sceneColor = 0x6ad6f0;

const Lights = () => {
	return (
		<>
			{/* Warm ambient with subtle pink undertones */}
			<ambientLight
				intensity={Platform.OS === 'web' ? 0.4 : 0.35}
				color="#fff0f5" // Lavender blush
			/>

			{/* Main key light with peachy warmth */}
			<directionalLight
				position={[1, 1.2, 1]}
				intensity={Platform.OS === 'web' ? 1.0 : 0.85}
				color="#ffebe6" // Soft peach
				castShadow={Platform.OS === 'web'} // Softer shadows for anime look
			/>

			{/* Mobile lighting for natural pink skin tones */}
			{(Platform.OS === 'android' || Platform.OS === 'ios') && (
				<>
					{/* Pink-tinted fill light */}
					<directionalLight
						position={[-1, 0.8, 0.5]}
						intensity={0.3}
						color="#ffe4e6" // Light pink fill
					/>

					{/* Anime-style rim lighting */}
					<directionalLight
						position={[0, 1, -1]}
						intensity={0.18}
						color="#fff8dc" // Cornsilk highlight
					/>

					{/* Subtle bounce light from below (anime technique) */}
					<directionalLight
						position={[0, -0.3, 1]}
						intensity={0.12}
						color="#ffeef0" // Very soft pink bounce
					/>
				</>
			)}
		</>
	);
};

const Model = () => {
	const { modelUri, vrm, mixer, loadModel } = useModelStore();
	const { scene } = useThree();

	useFrame((state, delta) => {
		vrm && vrm.update(delta);
		mixer && mixer.update(delta);
	});

	useEffect(() => {
		if (!modelUri) return;
		loadModel(modelUri, scene);
	}, [modelUri]);

	return null;
};

export const FiberCanvas = () => {
	const [OrbitControls, events] = useControls();
	const camera = useModelStore((state) => state.camera);

	return (
		<View style={{ flex: 1 }}>
			<View {...events} style={{ flex: 1 }}>
				<Canvas
					onCreated={({ gl, camera }) => {
						const _gl = gl.getContext();

						// Basic WebGL configuration
						gl.outputColorSpace = THREE.SRGBColorSpace;
						gl.toneMapping = THREE.ACESFilmicToneMapping;
						gl.toneMappingExposure = 1.3;

						// Shadow configuration
						gl.shadowMap.enabled = true;
						gl.shadowMap.type = THREE.PCFShadowMap;

						// Force precision
						gl.capabilities.precision = 'highp';
						gl.capabilities.logarithmicDepthBuffer = false;

						console.log('WebGL Renderer:', _gl.getParameter(_gl.RENDERER));
						console.log('WebGL Version:', _gl.getParameter(_gl.VERSION));
						console.log('WebGL Vendor:', _gl.getParameter(_gl.VENDOR));

						// Camera positioning
						if (Platform.OS === "web") {
							camera.position.set(0, 2, 5);
						} else {
							camera.position.set(0, 1.25, 1.85);
						}

						// Set background color
						gl.setClearColor(sceneColor);
					}}
					gl={{
						antialias: true,
						alpha: true,
						powerPreference: "high-performance",
						preserveDrawingBuffer: false,
						failIfMajorPerformanceCaveat: false,
						...(Platform.OS !== 'web' && {
							stencil: true,
							depth: true,
							logarithmicDepthBuffer: false,
							precision: 'highp',
						}),
					}}
					shadows
					camera={camera}
				>
					<Lights />
					<Suspense fallback={null}>
						<Model />
					</Suspense>
					<Grid />
					<OrbitControls target={new Vector3(0, 1, 0)} enableRotate enableZoom />
				</Canvas>
			</View>
			<MenusContainer />
			<ModelSelector />
		</View>
	);
};
