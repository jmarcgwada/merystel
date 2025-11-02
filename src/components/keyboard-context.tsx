
'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface TargetInput {
    value: string;
    name: string;
    ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
}

interface KeyboardContextType {
    isOpen: boolean;
    showKeyboard: () => void;
    hideKeyboard: (clearTarget?: boolean) => void;
    toggleKeyboard: () => void;
    
    isCaps: boolean;
    toggleCaps: () => void;

    inputValue: string;
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
    targetInput: TargetInput | null;
    setTargetInput: (target: TargetInput) => void;
    isKeyboardVisibleInHeader: boolean;

    pressKey: (key: string) => void;
    pressSpace: () => void;
    pressBackspace: () => void;
    pressEnter: () => void;
    clearInput: () => void;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

// A "dummy" context value for when the provider is not available.
const dummyKeyboardContext: KeyboardContextType = {
    isOpen: false,
    showKeyboard: () => {},
    hideKeyboard: () => {},
    toggleKeyboard: () => {},
    isCaps: false,
    toggleCaps: () => {},
    inputValue: "",
    setInputValue: () => {},
    targetInput: null,
    setTargetInput: () => {},
    isKeyboardVisibleInHeader: false,
    pressKey: () => {},
    pressSpace: () => {},
    pressBackspace: () => {},
    pressEnter: () => {},
    clearInput: () => {},
};


export function KeyboardProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCaps, setIsCaps] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [activeInput, setActiveInput] = useState<TargetInput | null>(null);

    const pathname = usePathname();
    const isSalesMode = useMemo(() => 
        pathname.startsWith('/pos') || pathname.startsWith('/supermarket') || pathname.startsWith('/restaurant'),
    [pathname]);

    const clearInput = useCallback(() => {
        setInputValue('');
    }, []);

    const showKeyboard = useCallback(() => {
        if (isSalesMode && activeInput?.name) {
            setIsOpen(true);
        }
    }, [activeInput, isSalesMode]);

    const hideKeyboard = useCallback((clearTarget = true) => {
        setIsOpen(false);
        if (clearTarget) {
            clearInput();
            setActiveInput(null);
        }
    }, [clearInput]);
    
    const toggleKeyboard = useCallback(() => {
        if (!isSalesMode) return;
        if (isOpen) {
            hideKeyboard();
        } else {
            showKeyboard();
        }
    }, [isOpen, showKeyboard, hideKeyboard, isSalesMode]);

    const setTargetInput = useCallback((target: TargetInput) => {
        if (!isSalesMode) return;
        setActiveInput(target);
        setInputValue(target.value);
    }, [isSalesMode]);
    
    useEffect(() => {
        if (!isSalesMode && isOpen) {
            hideKeyboard();
        }
    }, [isSalesMode, isOpen, hideKeyboard]);
    
    const toggleCaps = useCallback(() => setIsCaps(prev => !prev), []);

    const pressKey = useCallback((key: string) => {
        if (/^[a-zA-Z]$/.test(key)) {
            const char = isCaps ? key.toUpperCase() : key.toLowerCase();
            setInputValue(prev => prev + char);
        } else {
             setInputValue(prev => prev + key);
        }
    }, [isCaps]);

    const pressSpace = useCallback(() => {
        setInputValue(prev => prev + ' ');
    }, []);

    const pressBackspace = useCallback(() => {
        setInputValue(prev => prev.slice(0, -1));
    }, []);

    const pressEnter = useCallback(() => {
        if (activeInput?.ref.current) {
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true,
            });
            activeInput.ref.current.dispatchEvent(enterEvent);
        }
    }, [activeInput]);

    const isKeyboardVisibleInHeader = useMemo(() => {
        return isSalesMode && !!activeInput?.name;
    }, [activeInput, isSalesMode]);

    const value = useMemo(() => ({
        isOpen: isSalesMode && isOpen,
        showKeyboard,
        hideKeyboard,
        toggleKeyboard,
        isCaps,
        toggleCaps,
        inputValue,
        setInputValue,
        targetInput: activeInput,
        setTargetInput,
        isKeyboardVisibleInHeader,
        pressKey,
        pressSpace,
        pressBackspace,
        pressEnter,
        clearInput,
    }), [
        isOpen, showKeyboard, hideKeyboard, toggleKeyboard, isCaps, toggleCaps, 
        inputValue, activeInput, setTargetInput, isKeyboardVisibleInHeader,
        pressKey, pressSpace, pressBackspace, pressEnter, clearInput, isSalesMode
    ]);

    return (
        <KeyboardContext.Provider value={value}>
            {children}
        </KeyboardContext.Provider>
    );
}

export function useKeyboard() {
    const context = useContext(KeyboardContext);
    if (context === undefined) {
        // Return a dummy context to prevent crashes when provider is not in the tree
        return dummyKeyboardContext;
    }
    return context;
}
