import { Switch, Text, View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useModelStore } from '../../store/useModelStore';
import { ModalButton } from '../modal';
import { useModal } from '../../hooks/useModal';
import { useState } from 'react';

const SwitchItem = ({
	title,
	value,
	onValChange,
}: {
	title: string;
	value: boolean;
	onValChange: (val: boolean) => void;
}) => {
	return (
		<View style={styles.switchItemContainer}>
			<Text style={styles.switchItemText}>{title}</Text>
			<Switch value={value} onValueChange={onValChange} />
		</View>
	);
};

const ExpressionButton = ({
	expression,
	isActive,
	onPress,
}: {
	expression: string;
	isActive: boolean;
	onPress: () => void;
}) => {
	return (
		<TouchableOpacity
			style={[
				styles.expressionButton,
				isActive && styles.activeExpressionButton
			]}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<Text style={[
				styles.expressionButtonText,
				isActive && styles.activeExpressionButtonText
			]}>
				{expression}
			</Text>
		</TouchableOpacity>
	);
};

const ExpressionSelector = () => {
	const { facialExpression, setFacialExpression, expressionMap } = useModelStore();
	const [showAllExpressions, setShowAllExpressions] = useState(false);

	// Main expressions to show by default
	const mainExpressions = ['relaxed', 'smile', 'happy', 'sad', 'angry', 'surprised', 'wink', 'thinking'];

	// All available expressions
	const allExpressions = Object.keys(expressionMap).filter(exp => exp !== 'default');

	const expressionsToShow = showAllExpressions ? allExpressions : mainExpressions;

	return (
		<View style={styles.expressionContainer}>
			<View style={styles.expressionHeader}>
				<Text style={styles.sectionTitle}>Facial Expression</Text>
				<TouchableOpacity
					style={styles.toggleButton}
					onPress={() => setShowAllExpressions(!showAllExpressions)}
					activeOpacity={0.7}
				>
					<Text style={styles.toggleButtonText}>
						{showAllExpressions ? 'Show Less' : 'Show All'}
					</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.expressionGrid}>
				{expressionsToShow.map((expression) => (
					<ExpressionButton
						key={expression}
						expression={expression}
						isActive={facialExpression === expression}
						onPress={() => setFacialExpression(expression)}
					/>
				))}
			</View>
		</View>
	);
};

export const SettingsView = () => {
	const { settings, updateModelSettings } = useModelStore();
	const { onModalToggle, visible } = useModal();

	return (
		<ModalButton
			vis={visible}
			onToggle={onModalToggle}
			icon="cog-outline"
			containerStyle={{
				minWidth: '50%',
				maxHeight: '80%',
				borderRadius: 16,
				padding: 16,
			}}
		>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scrollContainer}
			>
				<Text style={styles.mainTitle}>Settings</Text>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Tracking Settings</Text>
					<View style={styles.switchContainer}>
						<SwitchItem
							title="Eye Tracking"
							value={settings.enableEyeLookAt}
							onValChange={(val) => updateModelSettings({ enableEyeLookAt: val })}
						/>
						<SwitchItem
							title="Head Tracking"
							value={settings.enableHeadTracking}
							onValChange={(val) => updateModelSettings({ enableHeadTracking: val })}
						/>
					</View>
				</View>

				<View style={styles.section}>
					<ExpressionSelector />
				</View>
			</ScrollView>
		</ModalButton>
	);
};

const styles = StyleSheet.create({
	scrollContainer: {
		paddingBottom: 16,
	},
	mainTitle: {
		fontSize: 24,
		fontWeight: '800',
		color: '#2d3748',
		letterSpacing: 0.5,
		marginBottom: 20,
		textAlign: 'center',
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '700',
		marginBottom: 12,
		color: '#2d3748',
		letterSpacing: 0.3,
	},
	switchContainer: {
		backgroundColor: 'rgba(226,232,240,0.5)',
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: 'rgba(0,0,0,0.08)',
	},
	switchItemContainer: {
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 8,
	},
	switchItemText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#4a5568',
		letterSpacing: 0.2,
	},
	expressionContainer: {
		width: '100%',
	},
	expressionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	toggleButton: {
		backgroundColor: '#4299e1',
		borderRadius: 8,
		padding: 10,
		shadowColor: '#4299e1',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 4,
	},
	toggleButtonText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '700',
		letterSpacing: 0.3,
	},
	expressionGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 10,
		backgroundColor: 'rgba(226,232,240,0.5)',
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: 'rgba(0,0,0,0.08)'
	},
	expressionButton: {
		backgroundColor: '#e2e8f0',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		minWidth: 80,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
		borderWidth: 1,
		borderColor: 'rgba(0,0,0,0.08)',
		opacity: 0.9,
	},
	activeExpressionButton: {
		backgroundColor: '#4299e1',
		shadowColor: '#4299e1',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 4,
		opacity: 1,
	},
	expressionButtonText: {
		fontSize: 14,
		fontWeight: '600',
		color: '#4a5568',
		textAlign: 'center',
		letterSpacing: 0.3,
		textTransform: 'capitalize',
	},
	activeExpressionButtonText: {
		color: '#ffffff',
		fontWeight: '700',
	},
});