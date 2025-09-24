import { Text, View, TouchableOpacity } from 'react-native';
import { MIXAMO_ANIMS, useModelStore } from '../../store/useModelStore';
import { ModalButton } from '../modal';
import { useModal } from '../../hooks/useModal';

export const MixamoAnimationView = () => {
    const { loadMixamoAnimation, playMixamoAnimation, mixamoAnimationName, loadedMixamoAnimations } = useModelStore();
    const { onModalToggle, visible } = useModal();

    const onButtonPress = async (name: keyof typeof MIXAMO_ANIMS) => {
        // First load the animation if not loaded
        const loaded = await loadMixamoAnimation(name);
        if (loaded) {
            // Then play it
            playMixamoAnimation(name);
        }
        onModalToggle(false);
    };

    const renderAnimationButton = (key: string, idx: number) => {
        const isActive = mixamoAnimationName === key;
        const isLoaded = loadedMixamoAnimations.has(key as keyof typeof MIXAMO_ANIMS);

        return (
            <TouchableOpacity
                key={idx}
                disabled={isActive}
                onPress={() => onButtonPress(key as keyof typeof MIXAMO_ANIMS)}
                style={{
                    backgroundColor: isActive ? '#e53e3e' : '#e2e8f0',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    minWidth: 80,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: isActive ? '#e53e3e' : '#000',
                    shadowOffset: { width: 0, height: isActive ? 2 : 1 },
                    shadowOpacity: isActive ? 0.3 : 0.1,
                    shadowRadius: isActive ? 4 : 2,
                    elevation: isActive ? 4 : 2,
                    borderWidth: 1,
                    borderColor: isActive ? '#c53030' : 'rgba(0,0,0,0.08)',
                    opacity: isActive ? 1 : 0.9,
                }}
                activeOpacity={0.7}
            >
                <Text
                    style={{
                        color: isActive ? '#ffffff' : '#4a5568',
                        fontSize: 14,
                        fontWeight: isActive ? '700' : '600',
                        textAlign: 'center',
                        letterSpacing: 0.3,
                    }}
                >
                    {key}
                </Text>
                {isLoaded && !isActive && (
                    <Text style={{
                        color: '#48bb78',
                        fontSize: 10,
                        fontWeight: '500',
                    }}>
                        ✓
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <ModalButton
            vis={visible}
            onToggle={onModalToggle}
            icon="walk-outline"
            containerStyle={{
                minWidth: '35%',
                backgroundColor: 'rgba(255,255,255,0.95)',
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 8,
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.08)',
                padding: 16,
            }}
        >
            <Text style={{
                fontSize: 24,
                fontWeight: '800',
                color: '#2d3748',
                letterSpacing: 0.5,
                marginBottom: 16,
                textAlign: 'center',
            }}>
                Mixamo Animations
            </Text>

            <View style={{
                gap: 10,
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
            }}>
                {Object.keys(MIXAMO_ANIMS).map(renderAnimationButton)}
            </View>

            {mixamoAnimationName && (
                <View style={{
                    backgroundColor: '#fed7d7',
                    padding: 10,
                    borderRadius: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: '#e53e3e',
                    marginTop: 16,
                }}>
                    <Text style={{
                        fontSize: 12,
                        color: '#c53030',
                        fontWeight: '600',
                        textAlign: 'center',
                    }}>
                        ✓ Playing Mixamo: {mixamoAnimationName}
                    </Text>
                </View>
            )}
        </ModalButton>
    );
};