
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '../ui/skeleton';
import { Label } from '../ui/label';

const LOCAL_STORAGE_QUOTA = 5 * 1024 * 1024; // 5 MB in bytes

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Octets';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function StorageIndicator() {
  const [usage, setUsage] = useState({ percentage: 0, totalSize: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const calculateStorage = useCallback(() => {
    if (typeof window === 'undefined') return;

    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          total += new Blob([value]).size;
        }
      }
    }
    
    const newPercentage = Math.round((total / LOCAL_STORAGE_QUOTA) * 100);
    
    setUsage(prevUsage => {
      if (prevUsage.totalSize === total) {
        return prevUsage;
      }
      return {
        totalSize: total,
        percentage: newPercentage,
      };
    });
  }, []);

  useEffect(() => {
    if (isClient) {
      calculateStorage(); // Initial calculation
      const interval = setInterval(calculateStorage, 5000); // Recalculate every 5 seconds
      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [isClient, calculateStorage]);


  const hue = 120 - (usage.percentage * 1.2);

  if (!isClient) {
    return <Skeleton className="w-48 h-6 rounded-md" />; // Skeleton loader
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-48 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Stockage local</Label>
                <span className="text-xs font-bold text-primary">{usage.percentage}%</span>
            </div>
            <Progress
              value={usage.percentage}
              className="h-2"
              indicatorStyle={{
                background: `linear-gradient(90deg, hsl(120, 70%, 50%), hsl(${hue < 0 ? 0 : hue}, 70%, 50%))`
              }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-center font-bold">{`${formatBytes(
            usage.totalSize
          )} / ${formatBytes(LOCAL_STORAGE_QUOTA)}`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
