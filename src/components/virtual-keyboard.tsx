
'use client';

import { useKeyboard } from "@/contexts/keyboard-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { ArrowLeft, Languages, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const Key = ({
  children,
  onClick,
  className,
  flex = 1,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  flex?: number;
}) => (
  <Button
    variant="outline"
    className={cn("h-14 text-xl bg-card hover:bg-secondary", className)}
    style={{ flex: flex }}
    onClick={onClick}
  >
    {children}
  </Button>
);

export function VirtualKeyboard() {
  const {
    isOpen,
    hideKeyboard,
    isCaps,
    toggleCaps,
    pressKey,
    pressBackspace,
    pressSpace,
  } = useKeyboard();

  const keys = [
    ["a", "z", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["q", "s", "d", "f", "g", "h", "j", "k", "l", "m"],
    ["w", "x", "c", "v", "b", "n"],
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && hideKeyboard()}>
        <SheetContent side="bottom" className="rounded-t-lg max-h-[50vh]">
            <div className="flex flex-col h-full p-2 space-y-1">
            {keys.map((row, rowIndex) => (
                <div key={rowIndex} className="flex space-x-1 w-full">
                {rowIndex === 2 && (
                    <Key onClick={toggleCaps} flex={1.5} className={cn(isCaps && "bg-primary text-primary-foreground")}>
                        <Languages className="h-6 w-6"/>
                    </Key>
                )}
                {row.map((key) => (
                    <Key key={key} onClick={() => pressKey(key)}>
                        {isCaps ? key.toUpperCase() : key}
                    </Key>
                ))}
                {rowIndex === 2 && (
                    <Key onClick={pressBackspace} flex={1.5}>
                       <ArrowLeft className="h-6 w-6"/>
                    </Key>
                )}
                </div>
            ))}
            <div className="flex space-x-1">
                <Key onClick={() => pressKey(",")} flex={1}>,</Key>
                <Key onClick={pressSpace} flex={5}>
                    Espace
                </Key>
                <Key onClick={() => pressKey(".")} flex={1}>.</Key>
                <Key onClick={hideKeyboard} flex={1.5}>
                    <CornerDownLeft className="h-6 w-6"/>
                </Key>
            </div>
            </div>
        </SheetContent>
    </Sheet>
  );
}

