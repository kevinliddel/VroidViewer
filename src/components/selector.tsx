import { Button, Image, Text, View, Animated } from 'react-native';
import { useModelStore } from '../store/useModelStore';
import { useEffect, useRef } from 'react';

export const ModelSelector = () => {
	const { modelName, thumbnail, isLoading, loadProgress, changeModel } = useModelStore();

	// Animation for progress bar
	const progressAnim = useRef(new Animated.Value(0)).current;
	const pulseAnim = useRef(new Animated.Value(1)).current;

	// Animate progress bar in real-time
	useEffect(() => {
		Animated.timing(progressAnim, {
			toValue: loadProgress / 100,
			duration: 200,
			useNativeDriver: false,
		}).start();
	}, [loadProgress, progressAnim]);

	// Pulse animation for loading state
	useEffect(() => {
		if (isLoading) {
			const pulse = Animated.loop(
				Animated.sequence([
					Animated.timing(pulseAnim, {
						toValue: 0.8,
						duration: 800,
						useNativeDriver: true,
					}),
					Animated.timing(pulseAnim, {
						toValue: 1,
						duration: 800,
						useNativeDriver: true,
					}),
				])
			);
			pulse.start();
			return () => pulse.stop();
		} else {
			pulseAnim.setValue(1);
		}
	}, [isLoading, pulseAnim]);

	const getProgressColor = () => {
		if (loadProgress < 30) return '#ff6b6b';
		if (loadProgress < 70) return '#ffd93d';
		return '#6bcf7f';
	};

	return (
		<View
			style={{
				position: 'absolute',
				bottom: 12,
				left: 12,
				backgroundColor: 'rgba(255,255,255,0.95)',
				borderRadius: 16,
				padding: 14,
				gap: 8,
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 4 },
				shadowOpacity: 0.15,
				shadowRadius: 8,
				elevation: 8,
				borderWidth: 1,
				borderColor: 'rgba(0,0,0,0.08)',
			}}
		>
			<Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
				<Text style={{
					fontSize: 16,
					fontWeight: '900',
					color: '#2d3748',
					letterSpacing: 0.5,
				}}>
					Model Select
				</Text>
			</Animated.View>

			{thumbnail && (
				<View style={{
					borderRadius: 8,
					overflow: 'hidden',
					backgroundColor: '#f7fafc',
					padding: 4,
					alignItems: 'center',
					justifyContent: 'center',
				}}>
					<Image
						source={{ uri: thumbnail }}
						style={{
							width: 72,
							height: 72,
							borderRadius: 4,
						}}
						resizeMode="cover"
					/>
				</View>
			)}

			<View style={{ gap: 6 }}>
				<View style={{
					backgroundColor: modelName === 'vrm0' ? '#4299e1' : '#e2e8f0',
					borderRadius: 8,
					overflow: 'hidden',
				}}>
					<Button
						title="VRM 0"
						onPress={() => {
							console.log('Pressed model vrm0');
							changeModel('vrm0');
						}}
						disabled={modelName === 'vrm0'}
						color={modelName === 'vrm0' ? '#ffffff' : '#4a5568'}
					/>
				</View>

				<View style={{
					backgroundColor: modelName === 'vrm1' ? '#4299e1' : '#e2e8f0',
					borderRadius: 8,
					overflow: 'hidden',
				}}>
					<Button
						title="VRM 1"
						onPress={() => changeModel('vrm1')}
						disabled={modelName === 'vrm1'}
						color={modelName === 'vrm1' ? '#ffffff' : '#4a5568'}
					/>
				</View>

				<View style={{
					backgroundColor: modelName === 'Sonya' ? '#4299e1' : '#e2e8f0',
					borderRadius: 8,
					overflow: 'hidden',
				}}>
					<Button
						title="Sonya"
						onPress={() => changeModel('Sonya')}
						disabled={modelName === 'Sonya'}
						color={modelName === 'Sonya' ? '#ffffff' : '#4a5568'}
					/>
				</View>
			</View>

			{isLoading ? (
				<View style={{ gap: 4 }}>
					<View style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}>
						<Text style={{
							fontSize: 12,
							color: '#4a5568',
							fontWeight: '600',
						}}>
							Loading...
						</Text>
						<Text style={{
							fontSize: 12,
							color: getProgressColor(),
							fontWeight: '700',
						}}>
							{loadProgress}%
						</Text>
					</View>

					<View style={{
						height: 6,
						backgroundColor: '#e2e8f0',
						borderRadius: 3,
						overflow: 'hidden',
					}}>
						<Animated.View style={{
							height: '100%',
							backgroundColor: getProgressColor(),
							borderRadius: 3,
							width: progressAnim.interpolate({
								inputRange: [0, 1],
								outputRange: ['0%', '100%'],
							}),
							shadowColor: getProgressColor(),
							shadowOffset: { width: 0, height: 0 },
							shadowOpacity: 0.6,
							shadowRadius: 4,
						}} />
					</View>

					<View style={{
						height: 2,
						backgroundColor: 'rgba(66, 153, 225, 0.2)',
						borderRadius: 1,
						overflow: 'hidden',
					}}>
						<Animated.View style={{
							height: '100%',
							backgroundColor: '#4299e1',
							borderRadius: 1,
							width: '30%',
							transform: [{
								translateX: progressAnim.interpolate({
									inputRange: [0, 1],
									outputRange: [-50, 250],
								}),
							}],
						}} />
					</View>
				</View>
			) : (
				<View style={{
					backgroundColor: '#f0fff4',
					padding: 8,
					borderRadius: 6,
					borderLeftWidth: 3,
					borderLeftColor: '#48bb78',
				}}>
					<Text style={{
						fontSize: 12,
						color: '#2f855a',
						fontWeight: '600',
						textAlign: 'center',
					}}>
						✓ Model Ready
					</Text>
				</View>
			)}
		</View>
	);
};