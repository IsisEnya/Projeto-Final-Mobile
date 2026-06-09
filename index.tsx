import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import App from './src/App';

function RootApp() {
  return (
    <>
      <App />
      <StatusBar style="dark" />
    </>
  );
}

registerRootComponent(RootApp);
