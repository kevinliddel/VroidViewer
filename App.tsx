import { StatusBar } from 'expo-status-bar';
import { FiberCanvas } from './src/features/fiberCanvas';

// The code on the fiberCanvas.tsx that prevented the "EXGL: gl.pixelStorei() doesn't support this parameter yet!" was preventing the model not to be displayed on iOS
// Instead, I just did this to avoid the log from spamming
const originalWarn = console.log;
console.log = (...args) => {
	if (args[0] && args[0].includes('gl.pixelStorei')) {
		return;
	}
	originalWarn.apply(console, args);
};

export default function App() {
	return (
		<>
			<FiberCanvas />
			<StatusBar translucent />
		</>
	);
}
