"use client"

import { useState, createContext } from "react";

type NoteProviderContextType = {
    noteText: string;
    setNoteText: (noteText: string) => void;
    noteTitle: string;
    setNoteTitle: (noteTitle: string) => void;
    noteTags: string[];
    setNoteTags: (tags: string[]) => void;
};

export const NoteProviderContext = createContext<NoteProviderContextType>({
    noteText: "",
    setNoteText: () => {},
    noteTitle: "",
    setNoteTitle: () => {},
    noteTags: [],
    setNoteTags: () => {},
});

function NoteProvider({children}: {children: React.ReactNode}) {
    const [noteText, setNoteText] = useState("")
    const [noteTitle, setNoteTitle] = useState("")
    const [noteTags, setNoteTags] = useState<string[]>([])

    return (
        <NoteProviderContext.Provider value={{ noteText, setNoteText, noteTitle, setNoteTitle, noteTags, setNoteTags}}>
            {children}
        </NoteProviderContext.Provider>
    );
}

export default NoteProvider;