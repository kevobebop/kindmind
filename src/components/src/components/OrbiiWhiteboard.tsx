'use client';
import React from 'react';
import { Tldraw, Editor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

export default function OrbiiWhiteboard() {
  const editorRef = React.useRef<Editor | null>(null);

  const handleMount = (editor: Editor) => {
    editorRef.current = editor;

    editor.createShape({
      id: editor.createShapeId(),
      type: 'text',
      x: 100,
      y: 100,
      props: {
        text: 'Welcome to Orbii’s Whiteboard!',
        font: 'draw',
        size: 'm',
        align: 'start',
        autoSize: true,
      },
    });
  };

  return (
    <div className="w-full h-[75vh] border rounded-lg overflow-hidden bg-white">
      <Tldraw onMount={handleMount} />
    </div>
  );
}
// This component is a simple wrapper around the Tldraw editor.
// It initializes the editor and creates a default text shape on mount.