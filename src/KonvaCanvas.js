// src/KonvaCanvas.js
import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import './KonvaCanvas.css';

const URLImage = ({ imageUrl, shapeProps, isSelected, onSelect, onChange }) => {
  const [image] = useImage(imageUrl);
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        image={image}
        ref={shapeRef}
        {...shapeProps}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onTransformEnd={() => {
          const node = shapeRef.current;
          const newAttrs = {
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: node.width() * node.scaleX(),
            height: node.height() * node.scaleY(),
          };
          node.scaleX(1);
          node.scaleY(1);
          onChange(newAttrs);
        }}
        onDragEnd={(e) => onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() })}
      />
      {isSelected && <Transformer ref={trRef} rotateEnabled resizeEnabled />}
    </>
  );
};

const ResizableText = ({ el, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Text
        ref={shapeRef}
        {...el}
        onClick={onSelect} 
        onTap={onSelect} 
        draggable
        onDragEnd={e =>
          onChange({ ...el, x: e.target.x(), y: e.target.y() })
        }
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...el,
            x: node.x(),
            y: node.y(),
            width: node.width() * scaleX,
            height: node.height() * scaleY,
            fontSize: el.fontSize * scaleY,
          });
        }}
      />
      {isSelected && <Transformer ref={trRef} rotateEnabled resizeEnabled />}
    </>
  );
};


const KonvaCanvas = () => {
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [videoRef, setVideoRef] = useState(null);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const addToHistory = () => {
    setHistory(h => [...h, JSON.stringify(elements)]);
    setRedoStack([]);
  };

  const addImage = () => {
    addToHistory();
    setElements([...elements, {
      id: Date.now().toString(),
      type: 'image',
      x: 50, y: 50,
      width: 120, height: 120,
      imageUrl: 'https://konvajs.org/assets/lion.png',
    }]);
  };

  const addText = () => {
  if (!textInput.trim()) return;
  addToHistory();

  const newText = {
    id: Date.now().toString(),
    type: 'text',
    x: 60,
    y: 60,
    text: textInput,
    fontSize: 24,
    draggable: true,
  };

  setElements(prev => [...prev, newText]);
  setSelectedId(newText.id); 
  setTextInput('');
};

  const addVideo = () => {
  addToHistory();
  const video = document.createElement('video');
  video.src = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;

  video.addEventListener('canplaythrough', () => {
    video.play();
    setVideoRef(video); // Only set after it's playable

    setElements(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'video',
        x: 100,
        y: 100,
        video: video, 
        width: 240,
        height: 140,
      }
    ]);
  });

  video.load(); // Trigger loading
};
const saveCanvas = () => {
  // Convert videos to simple serializable info before saving
  const serializableElements = elements.map(el => {
    if (el.type === 'video') {
      return { ...el, video: undefined }; // Remove video object (not serializable)
    }
    return el;
  });
  localStorage.setItem('savedCanvas', JSON.stringify(serializableElements));
  alert('Canvas saved!');
};

const loadCanvas = () => {
  const saved = localStorage.getItem('savedCanvas');
  if (saved) {
    const parsed = JSON.parse(saved);

    // Handle re-creating video elements
    parsed.forEach(el => {
      if (el.type === 'video') {
        const video = document.createElement('video');
        video.src = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;

        video.addEventListener('canplaythrough', () => {
          video.play();
          el.video = video;
          setVideoRef(video);
          setElements(parsed);
        });

        video.load();
      }
    });

    // If no videos, set directly
    if (!parsed.some(el => el.type === 'video')) {
      setElements(parsed);
    }
  } else {
    alert('No saved canvas found.');
  }
};






  useEffect(() => {
  if (!videoRef) return;

  const update = () => {
    setElements(e => [...e]); // Forces re-render
    requestAnimationFrame(update);
  };

  update();
}, [videoRef]);


  const updateElement = (id, attr) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...attr } : el));
  };

  const handleUndo = () => {
    if (!history.length) return;
    const prev = [...history];
    const last = prev.pop();
    setRedoStack(r => [...r, JSON.stringify(elements)]);
    setElements(JSON.parse(last));
    setHistory(prev);
  };

  const handleRedo = () => {
    if (!redoStack.length) return;
    const redo = [...redoStack];
    const last = redo.pop();
    setHistory(h => [...h, JSON.stringify(elements)]);
    setElements(JSON.parse(last));
    setRedoStack(redo);
  };

  const moveText = dir => {
  if (!selectedId) return;
  addToHistory();
  setElements(elements.map(el => {
    if (el.id === selectedId && el.type === 'text') {
      const delta = dir === 'up' ? { y: el.y - 5 }
                  : dir === 'down' ? { y: el.y + 5 }
                  : dir === 'left' ? { x: el.x - 5 }
                  : { x: el.x + 5 };
      return { ...el, ...delta };
    }
    return el;
  }));
};


  const changeZ = forward => {
    const idx = elements.findIndex(el => el.id === selectedId);
    if (idx < 0) return;
    const els = [...elements];
    const swapIdx = forward ? idx + 1 : idx - 1;
    if (swapIdx < 0 || swapIdx >= els.length) return;
    [els[idx], els[swapIdx]] = [els[swapIdx], els[idx]];
    setElements(els);
  };

  return (
    <div className="canvas-container">
      <div className="toolbar">
        <button onClick={addImage}>🖼️ Image</button>
        <input
          type="text" placeholder="Text…"
          value={textInput} onChange={e => setTextInput(e.target.value)}
        />
        <button onClick={addText}>📝 Add Text</button>
        <button onClick={addVideo}>🎬 Video</button>

        <div className="group">
          <button onClick={() => videoRef && (videoRef.paused ? videoRef.play() : videoRef.pause())}>▶️/⏸️</button>
          <button onClick={() => videoRef && videoRef.pause()}>⏹️</button>
        </div>

        <div className="group">
          <button onClick={() => moveText('up')}>↑</button>
          <button onClick={() => moveText('down')}>↓</button>
          <button onClick={() => moveText('left')}>←</button>
          <button onClick={() => moveText('right')}>→</button>
        </div>

        <div className="group">
          <button onClick={handleUndo}>↩️ Undo</button>
          <button onClick={handleRedo}>↪️ Redo</button>
        </div>

        <div className="group">
          <button onClick={() => changeZ(true)}>⬆️ Front</button>
          <button onClick={() => changeZ(false)}>⬇️ Back</button>
          
        </div>

        <div className="group">
  <button onClick={saveCanvas}>💾 Save</button>
  <button onClick={loadCanvas}>📂 Load</button>
</div>

      </div>

      <Stage
        width={window.innerWidth - 40}
        height={500}
        onMouseDown={() => setSelectedId(null)}
      >
        <Layer>
          {elements.map(el => {
            if (el.type === 'image') {
              return (
                <URLImage
                  key={el.id} imageUrl={el.imageUrl}
                  shapeProps={el} isSelected={el.id === selectedId}
                  onSelect={() => setSelectedId(el.id)}
                  onChange={attr => updateElement(el.id, attr)}
                />
              );
            }
            if (el.type === 'text') {
              return (
                <ResizableText
                  key={el.id} el={el}
                  isSelected={el.id === selectedId}
                  onSelect={() => setSelectedId(el.id)}
                  onChange={attr => updateElement(el.id, attr)}
                />
              );
            }
           if (el.type === 'video' && el.video instanceof HTMLVideoElement) {
  return (
    <KonvaImage
      key={el.id}
      image={el.video}
      {...el}
      onClick={() => setSelectedId(el.id)}
      draggable
      onDragEnd={e => updateElement(el.id, { x: e.target.x(), y: e.target.y() })}
    />
  );
}

            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default KonvaCanvas;
