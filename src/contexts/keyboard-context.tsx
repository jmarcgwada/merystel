
'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface TargetInput {
    value: string;
    name: string;
}

interface KeyboardContextType {
    isOpen: boolean;
    showKeyboard: () => void;
    hideKeyboard: () => void;
    
    isCaps: boolean;
    toggleCaps: () => void;

    inputValue: string;
    targetInput: TargetInput | null;
    setTargetInput: (target: TargetInput) => void;
    isKeyboardTargeted: boolean;

    pressKey: (key: string) => void;
    pressSpace: () => void;
    pressBackspace: () => void;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCaps, setIsCaps] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [targetInput, setTargetInputState] = useState<TargetInput | null>(null);

    const showKeyboard = useCallback(() => setIsOpen(true), []);
    const hideKeyboard = useCallback(() => setIsOpen(false), []);
    
    const setTargetInput = useCallback((target: TargetInput) => {
        setTargetInputState(target);
        if(target.name) {
            setInputValue(target.value);
        }
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

    const isKeyboardTargeted = useMemo(() => {
        return !!targetInput?.name && (targetInput.name === 'category-search' || targetInput.name === 'item-search');
    }, [targetInput]);

    const value = useMemo(() => ({
        isOpen,
        showKeyboard,
        hideKeyboard,
        isCaps,
        toggleCaps,
        inputValue,
        targetInput,
        setTargetInput,
        isKeyboardTargeted,
        pressKey,
        pressSpace,
        pressBackspace,
    }), [
        isOpen, showKeyboard, hideKeyboard, isCaps, toggleCaps, 
        inputValue, targetInput, setTargetInput, isKeyboardTargeted,
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
