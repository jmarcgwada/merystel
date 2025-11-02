'use client';

import React, { createContext, useContext } from 'react';

// Define the shape of the dummy context to avoid errors
interface DummyKeyboardContextType {
    isOpen: boolean;
    showKeyboard: () => void;
    hideKeyboard: (clearTarget?: boolean) => void;
    toggleKeyboard: () => void;
    isCaps: boolean;
    toggleCaps: () => void;
    inputValue: string;
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
    targetInput: null;
    setTargetInput: (target: any) => void;
    isKeyboardVisibleInHeader: boolean;
    pressKey: (key: string) => void;
    pressSpace: () => void;
    pressBackspace: () => void;
    pressEnter: () => void;
    clearInput: () => void;
}

// Create a "dummy" context value that does nothing.
const dummyKeyboardContext: DummyKeyboardContextType = {
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

// Create the context with a default dummy value
const KeyboardContext = createContext<DummyKeyboardContextType>(dummyKeyboardContext);

// The provider is now gone as it's not needed for a disabled feature.
// We keep the file and the hook to avoid breaking imports elsewhere.

export function useKeyboard() {
    // This hook will now always return the dummy context, effectively disabling it.
    return useContext(KeyboardContext);
}
