
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { usePos } from '@/contexts/pos-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from './ui/progress';

export function SessionManager({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { handleSignOut } = usePos();
  const [isWarningOpen, setWarningOpen] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const signOutAndClear = useCallback(async () => {
    setWarningOpen(false);
    await handleSignOut(true); // pass true to indicate it's an automatic sign out
  }, [handleSignOut]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    const sessionDurationMs = user?.sessionDuration ? user.sessionDuration * 60 * 1000 : 0;

    if (sessionDurationMs > 0) {
      // Set timer to show warning 10 seconds before expiration
      const warningTime = sessionDurationMs > 10000 ? sessionDurationMs - 10000 : 0;
      timerRef.current = setTimeout(() => {
        setWarningOpen(true);
      }, warningTime);
    }
  }, [user]);

  const handleExtendSession = () => {
    setWarningOpen(false);
    resetTimer();
  };

  useEffect(() => {
    if (isWarningOpen) {
      setCountdown(10);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            signOutAndClear();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isWarningOpen, signOutAndClear]);

  useEffect(() => {
    if (user) {
      const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
      const eventListener = () => resetTimer();

      events.forEach(event => window.addEventListener(event, eventListener));
      resetTimer();

      return () => {
        events.forEach(event => window.removeEventListener(event, eventListener));
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else {
        if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [user, resetTimer]);

  return (
    <>
      {children}
      <AlertDialog open={isWarningOpen} onOpenChange={setWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Expiration de session</AlertDialogTitle>
            <AlertDialogDescription>
              Votre session va expirer pour inactivité. Souhaitez-vous la prolonger ?
            </AlertDialogDescription>
            <div className="pt-2">
                 <Progress value={countdown * 10} className="h-2" />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
                <Button variant="outline" onClick={signOutAndClear}>Déconnexion</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
                <Button onClick={handleExtendSession}>
                    Prolonger ({countdown}s)
                </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
