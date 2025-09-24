import { View } from 'react-native';
import { MetaView } from './meta';
import { SettingsView } from './settings';
import { AnimationsView } from './animation';
import { MixamoAnimationView } from './mixamo';

export const MenusContainer = () => {
	return (
		<View
			style={{
				position: 'absolute',
				bottom: 12,
				right: 12,
				padding: 8,
				alignItems: 'center',
				gap: 12,
			}}
		>
			<MetaView />
			<MixamoAnimationView />
			<AnimationsView />
			<SettingsView />
		</View>
	);
};
