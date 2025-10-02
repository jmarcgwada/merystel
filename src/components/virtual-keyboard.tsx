
'use client';

import { useKeyboard } from "@/contexts/keyboard-context";
import { Button } from "./ui/button";
import { ArrowLeft, CornerDownLeft, Languages, Delete, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { useEffect } from "react";

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
    className={cn("h-12 text-lg bg-background/50 hover:bg-background", className)}
    style={{ flex: `1 0 ${flex * 2.5}rem` }}
    onClick={onClick}
    type="button"
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
    pressSpace,
    pressBackspace,
    targetInput,
  } = useKeyboard();

  useEffect(() => {
    if (isOpen && targetInput?.ref.current) {
        // Give focus back to the input that triggered the keyboard
        targetInput.ref.current.focus();
    }
  }, [isOpen, targetInput]);

  const keys = [
    ["a", "z", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["q", "s", "d", "f", "g", "h", "j", "k", "l", "m"],
    ["w", "x", "c", "v", "b", "n"],
  ];
  
  const numpadKeys = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    ["0", "."],
  ];

  const handleClose = () => {
    hideKeyboard();
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()} modal={false}>
      <DrawerContent className="p-2 pb-4 max-w-4xl mx-auto bg-secondary/80 backdrop-blur-sm" aria-describedby={undefined}>
        <DrawerHeader className="p-0 h-0">
            <DrawerTitle className="sr-only">Clavier Virtuel</DrawerTitle>
        </DrawerHeader>
        <div className="flex h-full space-x-2">
            {/* Left side: Alphabetical keyboard */}
            <div className="flex flex-col flex-1 space-y-1">
                {keys.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex space-x-1 w-full justify-center">
                    {rowIndex === 2 && (
                        <Key onClick={toggleCaps} flex={1.5} className={cn(isCaps && "bg-primary text-primary-foreground")}>
                            <Languages className="h-5 w-5"/>
                        </Key>
                    )}
                    {row.map((key) => (
                        <Key key={key} onClick={() => pressKey(key)}>
                            {isCaps ? key.toUpperCase() : key}
                        </Key>
                    ))}
                    {rowIndex === 2 && (
                        <Key onClick={pressBackspace} flex={1.5}>
                            <Delete className="h-5 w-5"/>
                        </Key>
                    )}
                    </div>
                ))}
                <div className="flex space-x-1 justify-center">
                    <Key onClick={() => pressKey(",")} flex={1}>,</Key>
                    <Key onClick={pressSpace} flex={5}>
                        Espace
                    </Key>
                    <Key onClick={() => pressKey(".")} flex={1}>.</Key>
                    <Key onClick={handleClose} flex={1.5} className="bg-destructive/80 text-destructive-foreground">
                        Fermer
                    </Key>
                </div>
            </div>

            {/* Right side: Numpad */}
            <div className="flex flex-col space-y-1" style={{width: '12rem'}}>
                 {numpadKeys.map((row, rowIndex) => (
                    <div key={`num-${rowIndex}`} className="flex space-x-1 w-full">
                        {row.map((key) => (
                            <Key key={key} onClick={() => pressKey(key)} flex={key === '0' ? 2.1 : 1}>
                                {key}
                            </Key>
                        ))}
                    </div>
                ))}
                <Key onClick={pressBackspace}>
                    <ArrowLeft className="h-5 w-5" />
                </Key>
            </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
