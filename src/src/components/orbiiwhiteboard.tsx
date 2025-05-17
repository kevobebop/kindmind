'use client';

import { useEffect, useRef } from 'react';
import { Editor, Tldraw, TldrawApp } from 'tldraw';
import 'tldraw/tldraw.css';

export default function OrbiiWhiteboard() {
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    // Optional: preload or configure something once the editor is mounted
    if (editorRef.current) {
      console.log('Tldraw editor ready:', editorRef.current);
    }
  }, []);

  return (
    <div className="w-full h-[80vh] rounded-xl overflow-hidden shadow-xl border">
      <Tldraw
        ref={editorRef}
        onMount={(editor) => {
          editorRef.current = editor;
          // You could set a custom shape set here or modify editor behavior
        }}
      />
    </div>
  );
}
