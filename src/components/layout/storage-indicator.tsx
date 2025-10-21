
'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const LOCAL_STORAGE_QUOTA = 5 * 1024 * 1024; // 5 MB in bytes

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function StorageIndicator() {
  const [usage, setUsage] = useState({ percentage: 0, totalSize: 0 });

  useEffect(() => {
    const calculateStorage = () => {
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
      setUsage({
        totalSize: total,
        percentage: (total / LOCAL_STORAGE_QUOTA) * 100,
      });
    };

    calculateStorage(); // Initial calculation
    const interval = setInterval(calculateStorage, 5000); // Recalculate every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []); // Empty dependency array ensures this effect runs only once

  // Calculate color based on usage percentage
  // Green (hsl(120, 70%, 50%)) to Yellow (hsl(48, 96%, 57%)) to Red (hsl(0, 84%, 60%))
  const hue = 120 - (usage.percentage * 1.2); // 120 (green) -> 0 (red)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-24 flex items-center gap-2">
            <Progress
              value={usage.percentage}
              className="h-2"
              indicatorClassName="transition-all duration-500"
              indicatorStyle={{
                background: `linear-gradient(90deg, hsl(120, 70%, 50%), hsl(${hue < 0 ? 0 : hue}, 70%, 50%))`
              }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Espace de stockage local utilisé :</p>
          <p className="font-bold text-center">{`${formatBytes(
            usage.totalSize
          )} / ${formatBytes(LOCAL_STORAGE_QUOTA)} (${usage.percentage.toFixed(2)}%)`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
