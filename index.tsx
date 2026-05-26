import { StatusBar } from 'expo-status-bar';
import App from './src/App';

export default function RootApp() {
  return (
    <>
      <App />
      <StatusBar style="dark" />
    </>
  );
}
