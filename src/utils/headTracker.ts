import { PerspectiveCamera } from "three";
import { VRMCore } from "@pixiv/three-vrm";
import * as THREE from "three";

export class HeadTracker {
    private vrm: VRMCore;
    private camera: PerspectiveCamera;
    private headBone: THREE.Object3D | null = null;
    private neckBone: THREE.Object3D | null = null;
    private spineBone: THREE.Object3D | null = null;
    private restHeadRotation = new THREE.Euler();
    private restNeckRotation = new THREE.Euler();
    private restSpineRotation = new THREE.Euler();
    private enabled = true;

    // Smoothing variables
    private targetYaw = 0;
    private targetPitch = 0;
    private currentYaw = 0;
    private currentPitch = 0;
    private smoothingFactor = 0.08;

    // VRM version detection
    private isVRM0 = false;

    // Direction vectors for calculations
    private tempMatrix = new THREE.Matrix4();

    constructor(vrm: VRMCore, camera: PerspectiveCamera) {
        this.vrm = vrm;
        this.camera = camera;
        this.detectVRMVersion();
        this.findBones();
        this.saveRestPose();
    }

    private detectVRMVersion() {
        // Check VRM version based on meta information
        this.isVRM0 = this.vrm.meta?.metaVersion === '0' ||
            !this.vrm.humanoid ||
            typeof this.vrm.humanoid.getNormalizedBoneNode !== 'function';
        console.log(`Head Tracker: Detected VRM version ${this.isVRM0 ? '0.x' : '1.0'}`);
    }

    private findBones() {
        if (this.vrm.humanoid && !this.isVRM0) {
            // VRM 1.0 - use humanoid system first
            this.headBone = this.vrm.humanoid.getNormalizedBoneNode('head');
            this.neckBone = this.vrm.humanoid.getNormalizedBoneNode('neck');
            this.spineBone = this.vrm.humanoid.getNormalizedBoneNode('spine');
        }

        // For VRM 0.x or as fallback, traverse scene
        if (!this.headBone || !this.neckBone || this.isVRM0) {
            this.vrm.scene.traverse((child) => {
                if (child.type === 'Bone') {
                    const boneName = child.name.toLowerCase();

                    if (!this.headBone && (
                        boneName.includes('head') ||
                        boneName === 'bip01 head' ||
                        boneName === 'mixamorig:head' ||
                        boneName.endsWith('head')
                    )) {
                        this.headBone = child;
                    }

                    if (!this.neckBone && (
                        boneName.includes('neck') ||
                        boneName === 'bip01 neck' ||
                        boneName === 'mixamorig:neck' ||
                        boneName.endsWith('neck')
                    )) {
                        this.neckBone = child;
                    }

                    if (!this.spineBone && (
                        (boneName.includes('spine') && !boneName.includes('spine1') && !boneName.includes('spine2')) ||
                        boneName === 'bip01 spine' ||
                        boneName === 'mixamorig:spine' ||
                        boneName === 'spine'
                    )) {
                        this.spineBone = child;
                    }
                }
            });
        }

        console.log('Head Tracker Bones Found:', {
            head: !!this.headBone,
            neck: !!this.neckBone,
            spine: !!this.spineBone,
            vrmVersion: this.isVRM0 ? '0.x' : '1.0',
            headBoneName: this.headBone?.name,
            neckBoneName: this.neckBone?.name,
            spineBoneName: this.spineBone?.name
        });
    }

    private saveRestPose() {
        if (this.headBone) {
            this.restHeadRotation.copy(this.headBone.rotation);
        }
        if (this.neckBone) {
            this.restNeckRotation.copy(this.neckBone.rotation);
        }
        if (this.spineBone) {
            this.restSpineRotation.copy(this.spineBone.rotation);
        }
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (!enabled) {
            this.resetToRestPose();
        }
    }

    update(delta: number) {
        if (!this.enabled || !this.headBone || !this.camera) return;

        if (this.isVRM0) {
            this.updateVRM0();
        } else {
            this.updateVRM1();
        }
    }

    private updateVRM1() {
        // Get world positions
        const cameraWorldPos = new THREE.Vector3();
        this.camera.getWorldPosition(cameraWorldPos);

        const headWorldPos = new THREE.Vector3();
        this.headBone!.getWorldPosition(headWorldPos);

        // Calculate direction from head to camera
        const direction = new THREE.Vector3();
        direction.subVectors(cameraWorldPos, headWorldPos).normalize();

        // Convert direction to local space of the VRM
        this.tempMatrix.copy(this.vrm.scene.matrixWorld).invert();
        const localDirection = direction.clone().transformDirection(this.tempMatrix);

        // Calculate rotation angles
        const yaw = Math.atan2(localDirection.x, localDirection.z);
        const pitch = Math.asin(-localDirection.y);

        // Limit rotation ranges
        const maxRotation = Math.PI / 5; // 36 degrees
        const clampedYaw = THREE.MathUtils.clamp(yaw, -maxRotation, maxRotation);
        const clampedPitch = THREE.MathUtils.clamp(pitch, -maxRotation * 0.6, maxRotation * 0.6);

        // Apply rotations with smooth blending
        if (this.headBone) {
            this.headBone.rotation.copy(this.restHeadRotation);
            this.headBone.rotation.y += clampedYaw * 0.7;
            this.headBone.rotation.x += clampedPitch * 0.7;
        }

        if (this.neckBone) {
            this.neckBone.rotation.copy(this.restNeckRotation);
            this.neckBone.rotation.y += clampedYaw * 0.3;
            this.neckBone.rotation.x += clampedPitch * 0.3;
        }
    }

    private updateVRM0() {
        // Get world positions
        const cameraWorldPos = new THREE.Vector3();
        this.camera.getWorldPosition(cameraWorldPos);

        const headWorldPos = new THREE.Vector3();
        this.headBone!.getWorldPosition(headWorldPos);

        // Calculate raw direction vector
        const direction = new THREE.Vector3();
        direction.subVectors(cameraWorldPos, headWorldPos).normalize();

        // For VRM 0.x, we need to work in the bone's local coordinate system
        // Get the head bone's world matrix and inverse it
        this.tempMatrix.copy(this.headBone!.matrixWorld).invert();

        // Transform camera position to head bone's local space
        const localCameraPos = cameraWorldPos.clone().applyMatrix4(this.tempMatrix);

        // Calculate angles directly in local space
        const localYaw = Math.atan2(localCameraPos.x, -localCameraPos.z); // Note the negative Z
        const distance = Math.sqrt(localCameraPos.x * localCameraPos.x + localCameraPos.z * localCameraPos.z);
        const localPitch = Math.atan2(localCameraPos.y, distance);

        // Set target angles with appropriate limits for VRM 0.x
        const maxYaw = Math.PI / 4; // 45 degrees
        const maxPitch = Math.PI / 6; // 30 degrees

        this.targetYaw = THREE.MathUtils.clamp(localYaw, -maxYaw, maxYaw);
        this.targetPitch = THREE.MathUtils.clamp(localPitch, -maxPitch * 0.7, maxPitch * 0.9);

        // Smooth interpolation
        this.currentYaw = THREE.MathUtils.lerp(this.currentYaw, this.targetYaw, this.smoothingFactor);
        this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, this.targetPitch, this.smoothingFactor);

        // Apply rotations with VRM 0.x specific distribution
        const headYawRatio = 0.65;
        const headPitchRatio = 0.8;
        const neckYawRatio = 0.25;
        const neckPitchRatio = 0.15;
        const spineYawRatio = 0.1;
        const spinePitchRatio = 0.05;

        if (this.headBone) {
            this.headBone.rotation.copy(this.restHeadRotation);
            this.headBone.rotation.y += this.currentYaw * headYawRatio;
            this.headBone.rotation.x += this.currentPitch * headPitchRatio;
        }

        if (this.neckBone) {
            this.neckBone.rotation.copy(this.restNeckRotation);
            this.neckBone.rotation.y += this.currentYaw * neckYawRatio;
            this.neckBone.rotation.x += this.currentPitch * neckPitchRatio;
        }

        if (this.spineBone) {
            this.spineBone.rotation.copy(this.restSpineRotation);
            this.spineBone.rotation.y += this.currentYaw * spineYawRatio;
            this.spineBone.rotation.x += this.currentPitch * spinePitchRatio;
        }
    }

    resetToRestPose() {
        if (this.headBone) {
            this.headBone.rotation.copy(this.restHeadRotation);
        }
        if (this.neckBone) {
            this.neckBone.rotation.copy(this.restNeckRotation);
        }
        if (this.spineBone) {
            this.spineBone.rotation.copy(this.restSpineRotation);
        }

        // Reset smoothing values
        this.currentYaw = 0;
        this.currentPitch = 0;
        this.targetYaw = 0;
        this.targetPitch = 0;
    }

    dispose() {
        // Clean up references
        this.headBone = null;
        this.neckBone = null;
        this.spineBone = null;
    }
}