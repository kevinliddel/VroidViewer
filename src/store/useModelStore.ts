import { MToonMaterialLoaderPlugin, VRMCore, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { createVRMAnimationClip, VRMAnimationLoaderPlugin, VRMLookAtQuaternionProxy } from '@pixiv/three-vrm-animation';
import { Platform } from 'react-native';
import { AnimationMixer, PerspectiveCamera, Scene } from 'three';
import { GLTFLoader } from 'three-stdlib';
import { create } from 'zustand';
import { getVrmThumbnail } from '../utils/vrm';
import * as THREE from 'three';

export const MODELS = {
    vrm0: require('../../assets/models/vrm0.vrm'),
    vrm1: require('../../assets/models/vrm1.vrm')
};

export const ANIMS = {
    idle: require('../../assets/animations/idle_loop.vrma'),

    // Comment these animation if you didn't download the motion packs
    // full_body: require('../../assets/animations/motion_pack/VRMA_01.vrma'),
    // greeting: require('../../assets/animations/motion_pack/VRMA_02.vrma'),
    // peace_sign: require('../../assets/animations/motion_pack/VRMA_03.vrma'),
    // shoot: require('../../assets/animations/motion_pack/VRMA_04.vrma'),
    // spin: require('../../assets/animations/motion_pack/VRMA_05.vrma'),
    // model_pose: require('../../assets/animations/motion_pack/VRMA_06.vrma'),
    // squat: require('../../assets/animations/motion_pack/VRMA_07.vrma'),
}

type ModelName = keyof typeof MODELS;
type AnimName = keyof typeof ANIMS;

type ModelSettings = {
    enableEyeLookAt: boolean;
};

// Safe plugin registration
const safeRegisterPlugin = (loader: GLTFLoader, pluginFactory: (parser: any) => any, pluginName: string) => {
    try {
        loader.register(pluginFactory);
        return true;
    } catch (error) {
        console.warn(`Failed to register ${pluginName}:`, error);
        return false;
    }
};

export type ModelState = {
    modelName: ModelName;
    modelUri: string;
    thumbnail: string | null;
    animationName: AnimName;
    vrm: VRMCore | null;
    mixer: AnimationMixer | null;
    isLoading: boolean;
    loadProgress: number;
    settings: ModelSettings;
    camera: PerspectiveCamera;
};

export type ModelAction = {
    changeModel: (name: ModelName) => void;
    loadModel: (uri: string, scene: Scene) => Promise<void>;
    updateModelSettings: (params: Partial<ModelSettings>) => void;
    loadAnimation: (name: AnimName) => Promise<void>;
};

export const useModelStore = create<ModelState & ModelAction>()((set, get) => ({
    modelName: 'vrm1',
    modelUri: MODELS.vrm1,
    thumbnail: null,
    vrm: null,
    mixer: null,
    animationName: ANIMS.idle,
    camera: Platform.OS === 'web' ? new PerspectiveCamera(30, undefined, 0.1, 20) : new PerspectiveCamera(70, undefined, 0.1, 2000),
    isLoading: true,
    loadProgress: 0,
    settings: {
        enableEyeLookAt: true
    },

    updateModelSettings(params) {
        if (params.enableEyeLookAt) {
            get().vrm!.lookAt!.target = get().camera
        } else {
            get().vrm!.lookAt!.target = null;
        }
        set((state) => ({ ...state, settings: { ...state.settings, ...params } }))
    },

    changeModel: (name) => {
        set({ modelName: name, modelUri: MODELS[name], thumbnail: null, isLoading: true, loadProgress: 0 })
    },

    loadModel: async (uri: string, scene: Scene) => {
        const currentVrm = get().vrm;
        const loader = new GLTFLoader();

        // Set loading state at the beginning
        set({ isLoading: true, loadProgress: 0 });

        // Optimized lighting setup
        scene.children.filter(child => child.type.includes('Light')).forEach(light => {
            scene.remove(light);
        });

        // ANIME-STYLE LIGHTING: Soft, warm tones for natural pink skin
        const ambientLight = new THREE.AmbientLight(0xfff0f5, 0.45); // Lavender blush ambient
        scene.add(ambientLight);

        // Main key light with warm peachy tone
        const keyLight = new THREE.DirectionalLight(0xffebe6, 0.9); // Soft peach tone
        keyLight.position.set(-1, 1.2, 1);
        keyLight.castShadow = false;
        scene.add(keyLight);

        // Mobile-specific anime lighting
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
            // Soft fill light with pink undertones
            const fillLight = new THREE.DirectionalLight(0xffe4e6, 0.25); // Light pink fill
            fillLight.position.set(1, 0.5, -0.5);
            scene.add(fillLight);

            // Subtle rim light for anime-style highlights
            const rimLight = new THREE.DirectionalLight(0xfff8dc, 0.15); // Cornsilk highlight
            rimLight.position.set(0, 1, -1);
            scene.add(rimLight);

            // Bottom-up bounce light (simulates anime lighting reflection)
            const bounceLight = new THREE.DirectionalLight(0xffeef0, 0.1); // Very soft pink bounce
            bounceLight.position.set(0, -0.5, 1);
            scene.add(bounceLight);
        }

        // Only Register the MToonMaterialLoaderPlugin for mobile because The model aren't render correctly on mobile only
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            safeRegisterPlugin(
                loader,
                (parser) => new MToonMaterialLoaderPlugin(parser),
                'MToonMaterialLoaderPlugin'
            );
        }

        safeRegisterPlugin(
            loader,
            (parser) => new VRMLoaderPlugin(parser, { autoUpdateHumanBones: true }),
            'VRMLoaderPlugin'
        );

        return new Promise<void>((resolve, reject) => {
            loader.load(uri,
                // onLoad callback
                (gltfVrm) => {
                    try {
                        const vrm = gltfVrm.userData.vrm as VRMCore;
                        // Optimization
                        VRMUtils.removeUnnecessaryVertices(gltfVrm.scene);
                        VRMUtils.combineSkeletons(gltfVrm.scene);
                        VRMUtils.combineMorphs(vrm);

                        if (vrm.meta.metaVersion === '0') {
                            VRMUtils.rotateVRM0(vrm);
                        }

                        // Remove old VRM
                        if (currentVrm) {
                            console.log('Removing old model')
                            scene.remove(currentVrm.scene);
                            VRMUtils.deepDispose(currentVrm.scene)
                        }

                        // Avoid the typescript error "TS2345: Argument of type 'VRMLookAt | undefined' is not assignable to parameter of type 'VRMLookAt' "
                        if (vrm.lookAt) {
                            try {
                                const lookAtQuatProxy = new VRMLookAtQuaternionProxy(vrm.lookAt);
                                lookAtQuatProxy.name = 'lookAtQuaternionProxy';
                                vrm.scene.add(lookAtQuatProxy);
                            } catch (error) {
                                console.warn('Failed to create lookAt proxy:', error);
                            }
                        }

                        // Disable frustumCulled (from three-vrm example)
                        vrm.scene.traverse((obj) => {
                            obj.frustumCulled = false;
                        });

                        // Get thumbnail asynchronously
                        getVrmThumbnail(gltfVrm.parser, vrm.meta.metaVersion).then((thumbnail) => {
                            if (thumbnail?.data.localUri) {
                                set({ thumbnail: thumbnail.data.localUri })
                            }
                        }).catch((error) => {
                            console.warn('Failed to get thumbnail:', error);
                        });

                        scene.add(vrm.scene);

                        // Update state with loaded model and set loading to false
                        set({
                            vrm,
                            isLoading: false,
                            loadProgress: 100
                        });

                        if (get().settings.enableEyeLookAt && vrm.lookAt) {
                            vrm.lookAt.target = get().camera;
                        }

                        // Load idle animation after model is loaded
                        get().loadAnimation('idle').then(() => {
                            console.log('Model and animation loaded successfully');
                            resolve();
                        }).catch((animError) => {
                            console.warn('Failed to load animation:', animError);
                            resolve(); // Still resolve since model loaded successfully
                        });

                    } catch (error) {
                        console.error('Error processing loaded model:', error);
                        set({ isLoading: false });
                        reject(error);
                    }
                },
                // onProgress callback
                (event) => {
                    if (event.lengthComputable) {
                        const progress = Math.round((event.loaded / event.total) * 100);
                        console.log(`Loading progress: ${progress}%`);
                        set({ loadProgress: progress });

                        // On mobile, sometimes the final progress event doesn't fire
                        // So we check if we're very close to completion
                        if (progress >= 99) {
                            console.log('Progress near completion, preparing to finalize...');
                        }
                    } else {
                        // If length is not computable, we can still show some progress
                        const estimatedProgress = Math.min(Math.floor(event.loaded / 50000), 90); // Rough estimation
                        set({ loadProgress: estimatedProgress });
                    }
                },
                // onError callback
                (error) => {
                    console.error('Error loading model:', error);
                    set({ isLoading: false, loadProgress: 0 });
                    reject(error);
                }
            );
        });
    },

    loadAnimation: async (name) => {
        const vrm = get().vrm;
        if (!vrm) {
            console.warn('No VRM model loaded, cannot load animation');
            return;
        }

        try {
            const loader = new GLTFLoader();

            safeRegisterPlugin(
                loader,
                (parser) => new VRMAnimationLoaderPlugin(parser),
                'VRMAnimationLoaderPlugin'
            );

            // Load VRMA
            const gltfVrma = await loader.loadAsync(ANIMS[name]);
            const vrmAnim = gltfVrma.userData.vrmAnimations?.[0];

            if (!vrmAnim) {
                console.warn(`No animation found in ${name}`);
                return;
            }

            // Create clip
            const clip = createVRMAnimationClip(vrmAnim, vrm);

            // Stop previous animation if exists
            const currentMixer = get().mixer;
            if (currentMixer) {
                currentMixer.stopAllAction();
            }

            // Play new animation
            const mixer = new AnimationMixer(vrm.scene);
            const action = mixer.clipAction(clip);
            action.play();

            set({ mixer: mixer, animationName: name });
            console.log(`Animation '${name}' loaded and playing`);
        } catch (error) {
            console.error(`Failed to load animation '${name}':`, error);
        }
    },
}));