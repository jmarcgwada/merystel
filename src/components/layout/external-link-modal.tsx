
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePos } from '@/contexts/pos-context';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { X, Maximize, Minimize } from 'lucide-react';

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';


export function ExternalLinkModal() {
  const {
    externalLinkModalEnabled,
    externalLinkUrl,
    externalLinkTitle,
    externalLinkModalWidth,
    externalLinkModalHeight,
  } = usePos();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State for dragging and resizing
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, direction: '' as ResizeDirection });
  const [hasBeenMoved, setHasBeenMoved] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const initializeModalState = useCallback(() => {
    const initialWidth = window.innerWidth * (externalLinkModalWidth / 100);
    const initialHeight = window.innerHeight * (externalLinkModalHeight / 100);
    setSize({ width: initialWidth, height: initialHeight });
    setPosition({ 
        x: (window.innerWidth - initialWidth) / 2,
        y: (window.innerHeight - initialHeight) / 2,
    });
    setHasBeenMoved(false);
    setIsLoading(true);
  }, [externalLinkModalWidth, externalLinkModalHeight]);


  useEffect(() => {
    const handleToggle = () => {
      if (externalLinkModalEnabled && externalLinkUrl) {
        if (!isOpen) {
          initializeModalState();
        }
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('toggleExternalLinkModal', handleToggle);
    return () => {
      window.removeEventListener('toggleExternalLinkModal', handleToggle);
    };
  }, [externalLinkModalEnabled, externalLinkUrl, isOpen, initializeModalState]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };
  
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current) {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    }
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, direction: ResizeDirection) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      direction: direction,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
        setHasBeenMoved(true);
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    } else if(isResizing) {
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = position.x;
      let newY = position.y;

      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      
      if (resizeStart.direction.includes('e')) newWidth = resizeStart.width + dx;
      if (resizeStart.direction.includes('w')) {
          newWidth = resizeStart.width - dx;
          newX = position.x + dx;
      }
      if (resizeStart.direction.includes('s')) newHeight = resizeStart.height + dy;
      if (resizeStart.direction.includes('n')) {
          newHeight = resizeStart.height - dy;
          newY = position.y + dy;
      }

      if (newWidth < 300) newWidth = 300;
      if (newHeight < 200) newHeight = 200;

      setSize({ width: newWidth, height: newHeight });
       if (resizeStart.direction.includes('w') || resizeStart.direction.includes('n')) {
            setPosition({ x: newX, y: newY });
        }
    }
  }, [isDragging, isResizing, dragStart, resizeStart, position.x, position.y]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);


  if (!externalLinkModalEnabled) {
    return null;
  }
  
  const dynamicStyle: React.CSSProperties = {
    width: `${size.width}px`,
    height: `${size.height}px`,
    top: `${position.y}px`,
    left: `${position.x}px`,
    transform: 'none', // Override shadcn's transform
    maxWidth: '100vw',
    maxHeight: '100vh',
  };

  const resizeHandles: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
  const getResizeHandleClass = (dir: ResizeDirection) => {
    switch (dir) {
      case 'n': return 'cursor-n-resize top-0 h-2 inset-x-2';
      case 's': return 'cursor-s-resize bottom-0 h-2 inset-x-2';
      case 'e': return 'cursor-e-resize right-0 w-2 inset-y-2';
      case 'w': return 'cursor-w-resize left-0 w-2 inset-y-2';
      case 'ne': return 'cursor-ne-resize top-0 right-0 h-3 w-3';
      case 'nw': return 'cursor-nw-resize top-0 left-0 h-3 w-3';
      case 'se': return 'cursor-se-resize bottom-0 right-0 h-3 w-3';
      case 'sw': return 'cursor-sw-resize bottom-0 left-0 h-3 w-3';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        ref={modalRef}
        className="p-0 border overflow-hidden flex flex-col shadow-2xl"
        style={dynamicStyle}
        onPointerDownOutside={(e) => {
            if ((e.target as HTMLElement).closest('[data-drag-handle]') || (e.target as HTMLElement).closest('[data-resize-handle]')) {
                e.preventDefault();
            }
        }}
      >
        <div 
          data-drag-handle
          onMouseDown={handleDragStart}
          className={cn(
            "flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
        >
          <DialogTitle>{externalLinkTitle || 'Contenu externe'}</DialogTitle>
           <button onClick={() => setIsOpen(false)} className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
             <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="relative w-full flex-1">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
                <Skeleton className="w-full h-full" />
            </div>
          )}
          <iframe
            src={externalLinkUrl}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            style={{ display: isLoading ? 'none' : 'block' }}
            title={externalLinkTitle || 'Contenu externe'}
            allow="microphone"
          />
        </div>
        {resizeHandles.map(dir => (
            <div
                key={dir}
                data-resize-handle
                onMouseDown={(e) => handleResizeStart(e, dir)}
                className={cn('absolute z-10', getResizeHandleClass(dir))}
            />
        ))}
      </DialogContent>
    </Dialog>
  );
}
