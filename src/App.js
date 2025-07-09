// src/App.js
import React from 'react';
import KonvaCanvas from './KonvaCanvas';
import ParticleBackground from './ParticleBackground';

function App() {
  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <ParticleBackground />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 0 20px rgba(0,0,0,0.2)',
        zIndex: 2
      }}>
        <KonvaCanvas />
      </div>
    </div>
  );
}

export default App;
