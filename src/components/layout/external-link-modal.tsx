
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePos } from '@/contexts/pos-context';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

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

  // State for dragging
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const [hasBeenDragged, setHasBeenDragged] = useState(false);

  useEffect(() => {
    const handleToggle = () => {
      if (externalLinkModalEnabled && externalLinkUrl) {
        setIsOpen(prev => !prev);
        setIsLoading(true); // Reset loading state each time it opens
        // Reset position when opening
        if (!isOpen) {
            setPosition({ x: 0, y: 0 });
            setHasBeenDragged(false);
        }
      }
    };

    window.addEventListener('toggleExternalLinkModal', handleToggle);
    return () => {
      window.removeEventListener('toggleExternalLinkModal', handleToggle);
    };
  }, [externalLinkModalEnabled, externalLinkUrl, isOpen]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current) {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
        setHasBeenDragged(true);
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
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
  }, [isDragging, dragStart]);


  if (!externalLinkModalEnabled) {
    return null;
  }

  const modalWidth = `${externalLinkModalWidth || 80}vw`;
  const modalHeight = `${externalLinkModalHeight || 90}vh`;
  
  const dynamicStyle: React.CSSProperties = {
    width: modalWidth,
    height: modalHeight,
    maxWidth: 'none',
    maxHeight: 'none',
  };

  if (hasBeenDragged) {
      dynamicStyle.transform = `translate(0, 0)`;
      dynamicStyle.top = `${position.y}px`;
      dynamicStyle.left = `${position.x}px`;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        ref={modalRef}
        className={cn(
            "p-0 border overflow-hidden flex flex-col shadow-2xl",
             !hasBeenDragged && "top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2"
        )}
        style={dynamicStyle}
        onPointerDownOutside={(e) => {
            // This prevents the dialog from closing when starting a drag from the header.
            if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
                e.preventDefault();
            }
        }}
      >
        <div 
          data-drag-handle
          onMouseDown={handleMouseDown}
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
      </DialogContent>
    </Dialog>
  );
}
