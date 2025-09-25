
'use client';

import { useKeyboard } from "@/contexts/keyboard-context";
import { Button } from "./ui/button";
import { ArrowLeft, CornerDownLeft, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";

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
    className={cn("h-12 text-lg bg-card hover:bg-secondary", className)}
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
    pressSpace,
    pressBackspace,
  } = useKeyboard();

  const keys = [
    ["a", "z", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["q", "s", "d", "f", "g", "h", "j", "k", "l", "m"],
    ["w", "x", "c", "v", "b", "n"],
  ];

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && hideKeyboard()} modal={false}>
      <DrawerContent className="p-2 pb-4 max-w-4xl mx-auto" aria-describedby={undefined}>
        <DrawerHeader className="p-0 h-0">
            <DrawerTitle className="sr-only">Clavier Virtuel</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col h-full space-y-1">
        {keys.map((row, rowIndex) => (
            <div key={rowIndex} className="flex space-x-1 w-full justify-center">
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
        <div className="flex space-x-1 justify-center">
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
      </DrawerContent>
    </Drawer>
  );
}
