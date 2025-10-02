
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { usePos } from '@/contexts/pos-context';
import { Skeleton } from '@/components/ui/skeleton';

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

  useEffect(() => {
    const handleToggle = () => {
      if (externalLinkModalEnabled && externalLinkUrl) {
        setIsOpen(prev => !prev);
        setIsLoading(true); // Reset loading state each time it opens
      }
    };

    window.addEventListener('toggleExternalLinkModal', handleToggle);
    return () => {
      window.removeEventListener('toggleExternalLinkModal', handleToggle);
    };
  }, [externalLinkModalEnabled, externalLinkUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (!externalLinkModalEnabled) {
    return null;
  }

  const modalWidth = `${externalLinkModalWidth || 80}vw`;
  const modalHeight = `${externalLinkModalHeight || 90}vh`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        className="p-0 border-0 overflow-hidden"
        style={{ width: modalWidth, height: modalHeight, maxWidth: 'none' }}
      >
        <div className="relative w-full h-full">
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
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
