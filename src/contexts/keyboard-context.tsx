
'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';

interface TargetInput {
    value: string;
    name: string;
    ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
}

interface KeyboardContextType {
    isOpen: boolean;
    showKeyboard: () => void;
    hideKeyboard: () => void;
    toggleKeyboard: () => void;
    
    isCaps: boolean;
    toggleCaps: () => void;

    inputValue: string;
    targetInput: TargetInput | null;
    setTargetInput: (target: TargetInput) => void;
    isKeyboardVisibleInHeader: boolean;

    pressKey: (key: string) => void;
    pressSpace: () => void;
    pressBackspace: () => void;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCaps, setIsCaps] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [activeInput, setActiveInput] = useState<TargetInput | null>(null);

    const showKeyboard = useCallback(() => {
        if (activeInput?.name) {
            setIsOpen(true);
        }
    }, [activeInput]);

    const hideKeyboard = useCallback(() => {
        setIsOpen(false);
        setActiveInput(null); // This will hide the header button
    }, []);
    
    const toggleKeyboard = useCallback(() => {
        if (isOpen) {
            hideKeyboard();
        } else {
            showKeyboard();
        }
    }, [isOpen, showKeyboard, hideKeyboard]);

    const setTargetInput = useCallback((target: TargetInput) => {
        setActiveInput(target);
        setInputValue(target.value);
    }, []);
    
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

    const isKeyboardVisibleInHeader = useMemo(() => {
        return !!activeInput?.name;
    }, [activeInput]);

    const value = useMemo(() => ({
        isOpen,
        showKeyboard,
        hideKeyboard,
        toggleKeyboard,
        isCaps,
        toggleCaps,
        inputValue,
        targetInput: activeInput,
        setTargetInput,
        isKeyboardVisibleInHeader,
        pressKey,
        pressSpace,
        pressBackspace,
    }), [
        isOpen, showKeyboard, hideKeyboard, toggleKeyboard, isCaps, toggleCaps, 
        inputValue, activeInput, setTargetInput, isKeyboardVisibleInHeader,
        pressKey, pressSpace, pressBackspace
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
        throw new Error('useKeyboard doit être utilisé dans un KeyboardProvider');
    }
    return context;
}
