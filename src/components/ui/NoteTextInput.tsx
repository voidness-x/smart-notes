"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { debounceTimeout } from "@/lib/constants";
import useNote from "@/hooks/useNote";
import { useRealtimeNote } from "@/hooks/useRealtimeNote";
import { updateNoteAction, updateNoteTagsAction, updateNoteTitleAction } from "@/actions/notes";
import { Button } from "./button";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Code,
  X,
  Tag as TagIcon,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { Input } from "./input";
import ImageCropModal from "./ImageCropModal";
import ImageResizeModal from "./ImageResizeModal";
import imageCompression from "browser-image-compression";

type Props = {
    noteId: string;
    startingNoteText: string;
    startingTags?: string[];
    startingTitle?: string;
    isCollaborative?: boolean;
};

let updateTimeout: NodeJS.Timeout;
let titleUpdateTimeout: NodeJS.Timeout;
let noteTextUpdateTimeout: NodeJS.Timeout;

function NoteTextInput({noteId, startingNoteText, startingTags = [], startingTitle = "", isCollaborative = false}: Props) {
    const noteIdParam = useSearchParams().get("noteId") || ""
    const {noteText, setNoteText, noteTitle, setNoteTitle, noteTags, setNoteTags} = useNote();
    
    // Ref to prevent circular updates when programmatically setting content
    const isUpdatingFromStateRef = useRef(false);
    const isRealtimeUpdateRef = useRef(false);
    const lastSavedContentRef = useRef<string>("");

    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [readingTime, setReadingTime] = useState(0);
    const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | "">("");
    const [tags, setTags] = useState<string[]>(startingTags);
    const [tagInput, setTagInput] = useState("");
    const [title, setTitle] = useState<string>(startingTitle);
    const [showCropModal, setShowCropModal] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [showResizeModal, setShowResizeModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ src: string; width?: number; height?: number } | null>(null);
    const [isCompressingImage, setIsCompressingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }) as any,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder: 'Type your notes here...',
            }),
            Image.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        width: {
                            default: null,
                            renderHTML: (attributes) => {
                                if (!attributes.width) {
                                    return {};
                                }
                                return {
                                    width: attributes.width,
                                };
                            },
                        },
                        height: {
                            default: null,
                            renderHTML: (attributes) => {
                                if (!attributes.height) {
                                    return {};
                                }
                                return {
                                    height: attributes.height,
                                };
                            },
                        },
                    };
                },
            }).configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-md cursor-pointer',
                    style: 'max-width: 100%; height: auto;',
                },
            }),
        ],
        content: startingNoteText,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'min-h-full p-4 focus:outline-none',
            },
        },
        onUpdate: ({ editor }) => {
            // Don't update global state if we're programmatically updating the editor
            // or if this is a real-time update from another user
            if (isUpdatingFromStateRef.current || isRealtimeUpdateRef.current) {
                return;
            }
            
            const html = editor.getHTML();

            // Calculate word count from plain text
            const plainText = editor.getText();
            const words = plainText.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
            setCharCount(plainText.replace(/\s/g, "").length);
    setReadingTime(Math.ceil(words.length / 200));

            // Debounced update to global state (for sidebar sync)
            // Only update if content actually changed
            clearTimeout(noteTextUpdateTimeout);
            noteTextUpdateTimeout = setTimeout(() => {
                // Double-check we're not in the middle of a programmatic update
                if (!isUpdatingFromStateRef.current) {
                    setNoteText(html);
                }
            }, 100); // Shorter debounce for UI responsiveness

            // Debounced save to database
        setSaveStatus("saving");
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(async () => {
                // Mark as local update to prevent real-time subscription from triggering
                if (isCollaborative && noteIdParam === noteId) {
                    markLocalUpdate();
                }
                await updateNoteAction(noteId, html);
                lastSavedContentRef.current = html;
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus(""), 1500);
        }, debounceTimeout);
        },
    });

    // Real-time collaboration: Subscribe to note changes
    const handleRealtimeNoteChange = useCallback((newText: string, newTitle?: string, newTags?: string[]) => {
        if (!editor || noteIdParam !== noteId) return;
        
        // Mark as real-time update to prevent triggering onUpdate
        isRealtimeUpdateRef.current = true;
        isUpdatingFromStateRef.current = true;

        // Update editor content if text changed and is not empty
        if (newText && newText.trim() && newText !== lastSavedContentRef.current) {
            const currentContent = editor.getHTML();
            // Only update if content is actually different
            if (currentContent !== newText) {
                editor.commands.setContent(newText);
                lastSavedContentRef.current = newText;
                // Also update global state for sidebar sync
                setNoteText(newText);
            }
        }

        // Update title if changed
        if (newTitle !== undefined && newTitle !== title) {
            setTitle(newTitle);
            if (noteIdParam === noteId) {
                setNoteTitle(newTitle);
            }
        }

        // Update tags if changed
        if (newTags !== undefined && JSON.stringify(newTags) !== JSON.stringify(tags)) {
            setTags(newTags);
            if (noteIdParam === noteId) {
                setNoteTags(newTags);
            }
        }

        // Reset flags after update
        setTimeout(() => {
            isRealtimeUpdateRef.current = false;
            isUpdatingFromStateRef.current = false;
        }, 100);
    }, [editor, noteIdParam, noteId, title, tags, setNoteTitle, setNoteTags, setNoteText]);

    // Enable real-time updates only for collaborative notes
    const { markLocalUpdate } = useRealtimeNote(
        isCollaborative && noteIdParam === noteId ? noteId : null,
        handleRealtimeNoteChange,
        isCollaborative
    );

    // Track previous noteId to detect note switches
    const prevNoteIdRef = useRef<string>("");
    const isActiveNoteRef = useRef<boolean>(false);
    const justInitializedRef = useRef<boolean>(false);
    
    // Clear global noteText when switching notes to prevent content copying
    useEffect(() => {
        const isActive = noteIdParam === noteId;
        isActiveNoteRef.current = isActive;
        
        // If noteIdParam changed (switched to a different note), clear global state immediately
        if (prevNoteIdRef.current !== noteIdParam && prevNoteIdRef.current !== "") {
            // Clear immediately to prevent stale data from affecting other notes
            setNoteText("");
            setNoteTags([]);
            // Don't clear title - it will be set from startingTitle in the next effect
        }
        prevNoteIdRef.current = noteIdParam;
    }, [noteIdParam, noteId, setNoteText, setNoteTags]);

    // Initialize editor content and title when note becomes active
    useEffect(() => {
        if (noteIdParam === noteId && editor) {
            // Clear global state first to prevent old content
            setNoteText("");
            // Set title from startingTitle - default to "No title" if empty
            const titleToSet = startingTitle && startingTitle.trim() ? startingTitle : "No title";
            setNoteTitle(titleToSet);
            // Set tags from startingTags
            setNoteTags(startingTags || []);
            // Set editor content from startingNoteText
            // Set flag to prevent onUpdate from triggering during initialization
            isUpdatingFromStateRef.current = true;
            editor.commands.setContent(startingNoteText || "");
            // Mark that we just initialized to prevent sync effect from overwriting
            justInitializedRef.current = true;
            // Reset flags after a brief delay to allow sync for actual edits
            setTimeout(() => {
                justInitializedRef.current = false;
                isUpdatingFromStateRef.current = false;
            }, 100);
        }
    }, [editor, startingNoteText, startingTitle, startingTags, noteIdParam, noteId, setNoteText, setNoteTitle, setNoteTags]);

    // Sync editor from global noteText only if this is the active note and noteText is fresh
    // Don't sync if we just initialized (to prevent overwriting with stale data)
    // This effect is mainly for syncing from other sources (like sidebar updates), not from local edits
    useEffect(() => {
        if (noteIdParam === noteId && noteText && editor && noteText.trim() && !justInitializedRef.current) {
            const currentContent = editor.getHTML();
            // Only sync if:
            // 1. Content is different
            // 2. Editor already has content (not just initialized as empty)
            // 3. This prevents overwriting empty new notes with stale global noteText
            // 4. We're not currently updating from state (to prevent loops)
            const plainCurrentText = editor.getText();
            if (currentContent !== noteText && plainCurrentText.trim() !== "" && !isUpdatingFromStateRef.current) {
                // Set flag to prevent onUpdate from triggering during programmatic update
                isUpdatingFromStateRef.current = true;
                editor.commands.setContent(noteText);
                // Reset flag after a brief delay to allow the update to complete
                setTimeout(() => {
                    isUpdatingFromStateRef.current = false;
                }, 50);
            }
        }
    }, [noteText, noteIdParam, noteId, editor]);

    useEffect(() => {
        if (noteIdParam === noteId) {
            setTags(startingTags);
            // Default to "No title" if startingTitle is empty
            const newTitle = startingTitle && startingTitle.trim() ? startingTitle : "No title";
            setTitle(newTitle);
            // Don't update global state here - it's already handled in the initialization effect
            // This prevents race conditions when switching notes
        }
    }, [startingTags, startingTitle, noteIdParam, noteId]);

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim().toLowerCase();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            const newTags = [...tags, trimmedTag];
            setTags(newTags);
            // Update global state immediately for sidebar sync
            if (noteIdParam === noteId) {
                setNoteTags(newTags);
            }
            // Mark as local update for collaborative notes
            if (isCollaborative && noteIdParam === noteId) {
                markLocalUpdate();
            }
            updateNoteTagsAction(noteId, newTags);
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        const newTags = tags.filter(tag => tag !== tagToRemove);
        setTags(newTags);
        // Update global state immediately for sidebar sync
        if (noteIdParam === noteId) {
            setNoteTags(newTags);
        }
        // Mark as local update for collaborative notes
        if (isCollaborative && noteIdParam === noteId) {
            markLocalUpdate();
        }
        updateNoteTagsAction(noteId, newTags);
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (tagInput.trim()) {
                addTag(tagInput);
            }
        }
    };

    const handleTagInputBlur = () => {
        // Add tag when input loses focus (mobile keyboard dismisses)
        if (tagInput.trim()) {
            addTag(tagInput);
        }
    };

        const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        // Always update global state when user types (only if this note is active)
        // This ensures sidebar updates immediately
        if (noteIdParam === noteId) {
            // If user clears the title, default to "No title"
            const titleToSet = newTitle.trim() || "No title";
            setNoteTitle(titleToSet);
        }
        
        // Debounced save - save "No title" if empty
        clearTimeout(titleUpdateTimeout);
        titleUpdateTimeout = setTimeout(async () => {
            // Mark as local update for collaborative notes
            if (isCollaborative && noteIdParam === noteId) {
                markLocalUpdate();
            }
            const titleToSave = newTitle.trim() || "No title";
            await updateNoteTitleAction(noteId, titleToSave);
        }, debounceTimeout);
    };

    const addLink = () => {
        const previousUrl = editor?.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return;
        }

        setIsCompressingImage(true);

        try {
            // Compress image before processing
            // Target: max 600KB (to leave room for base64 encoding overhead ~33%)
            // Base64 adds ~33% overhead, so 600KB * 1.33 = ~800KB final size
            // This ensures final base64 string stays well under 1MB
            const options = {
                maxSizeMB: 0.6,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                fileType: file.type,
                initialQuality: 0.8,
            };

            const compressedFile = await imageCompression(file, options);
            
            // Read compressed file and show crop modal
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                setImageToCrop(imageUrl);
                setShowCropModal(true);
                setIsCompressingImage(false);
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error("Error compressing image:", error);
            // Fallback to original file if compression fails
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                setImageToCrop(imageUrl);
                setShowCropModal(true);
                setIsCompressingImage(false);
            };
            reader.readAsDataURL(file);
        }
        
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleCropComplete = (croppedImageUrl: string) => {
        if (editor && croppedImageUrl) {
            editor.chain().focus().setImage({ src: croppedImageUrl }).run();
        }
        setShowCropModal(false);
        setImageToCrop(null);
    };

    const handleImageResize = (width: number, height: number) => {
        if (editor && selectedImage) {
            // Find and update the image node
            const { state } = editor;
            const { tr } = state;
            let imagePos = -1;
            
            state.doc.descendants((node, pos) => {
                if (node.type.name === 'image' && node.attrs.src === selectedImage.src) {
                    imagePos = pos;
                    return false;
                }
            });

            if (imagePos !== -1) {
                tr.setNodeMarkup(imagePos, undefined, {
                    ...state.doc.nodeAt(imagePos)?.attrs,
                    width,
                    height,
                });
                editor.view.dispatch(tr);
            }
        }
        setShowResizeModal(false);
        setSelectedImage(null);
    };

    // Handle image clicks to show resize modal
    useEffect(() => {
        if (!editor) return;

        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'IMG' && target.closest('.ProseMirror')) {
                const img = target as HTMLImageElement;
                setSelectedImage({
                    src: img.src,
                    width: img.width || undefined,
                    height: img.height || undefined,
                });
                setShowResizeModal(true);
            }
        };

        const editorElement = editor.view.dom;
        editorElement.addEventListener('click', handleClick);

        return () => {
            editorElement.removeEventListener('click', handleClick);
        };
    }, [editor]);

    if (!editor) return null;

return (
    <div className="flex flex-col h-full w-full max-w-4xl">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 border rounded-t-md p-2 bg-muted/50 items-center mb-2">
                <Button
                    type="button"
                    size="sm"
                    variant={editor.isActive("bold") ? "default" : "outline"}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className="h-8 w-8 p-0"
                >
                    <Bold className="h-4 w-4" />
                </Button>

                <Button
                    type="button"
                    size="sm"
                    variant={editor.isActive("italic") ? "default" : "outline"}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className="h-8 w-8 p-0"
                >
                    <Italic className="h-4 w-4" />
                </Button>

                <Button
                    type="button"
                    size="sm"
                    variant={editor.isActive("underline") ? "default" : "outline"}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className="h-8 w-8 p-0"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Button>

                <Button
                    type="button"
                    size="sm"
                    variant={editor.isActive("strike") ? "default" : "outline"}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className="h-8 w-8 p-0"
                >
                    <Strikethrough className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    size="sm"
                    variant={editor.isActive("heading", { level: 1 }) ? "default" : "outline"}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className="h-8 w-8 p-0"
                >
                    <Heading1 className="h-4 w-4" />
                </Button>

                <Button
                    type="button"
                    size="sm"
                    variant={editor.isActive("heading", { level: 2 }) ? "default" : "outline"}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className="h-8 w-8 p-0"
                >
                    <Heading2 className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    size="sm"
                    variant={editor.isActive("bulletList") ? "default" : "outline"}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className="h-8 w-8 p-0"
                >
                    <List className="h-4 w-4" />
                </Button>

                <Button
                    type="button"
                    size="sm"
                    variant={editor.isActive("orderedList") ? "default" : "outline"}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className="h-8 w-8 p-0"
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    size="sm"
                    variant={editor.isActive({ textAlign: 'left' }) ? "default" : "outline"}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className="h-8 w-8 p-0"
                >
                    <AlignLeft className="h-4 w-4" />
                </Button>

                <Button
                    type="button"
                    size="sm"
                    variant={editor.isActive({ textAlign: 'center' }) ? "default" : "outline"}
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className="h-8 w-8 p-0"
                >
                    <AlignCenter className="h-4 w-4" />
                </Button>

                <Button
                    type="button"
                    size="sm"
                    variant={editor.isActive({ textAlign: 'right' }) ? "default" : "outline"}
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className="h-8 w-8 p-0"
                >
                    <AlignRight className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    size="sm"
                    variant={editor.isActive("link") ? "default" : "outline"}
                    onClick={addLink}
                    className="h-8 w-8 p-0"
                >
                    <LinkIcon className="h-4 w-4" />
                </Button>

                <Button
                    type="button"
                    size="sm"
                    variant={editor.isActive("code") ? "default" : "outline"}
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className="h-8 w-8 p-0"
                >
                    <Code className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                />
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 w-8 p-0"
                    disabled={isCompressingImage}
                >
                    {isCompressingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <ImageIcon className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Title and Tags Section */}
            <div className="border rounded-md p-2 bg-muted/30 mb-2">
                <div className="flex items-center justify-between gap-4">
                    {/* Title Input on Left */}
                    <div className="flex-1 min-w-0">
                        <Input
                            value={title}
                            onChange={handleTitleChange}
                            placeholder="Note title..."
                            className="h-8 text-sm font-medium"
                        />
                    </div>

                    {/* Tags on Right */}
                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs"
                            >
                                <TagIcon className="h-3 w-3" />
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                        <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagInputKeyDown}
                            onBlur={handleTagInputBlur}
                            placeholder="Add tag..."
                            className="h-7 w-24 text-xs"
                        />
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className="custom-scrollbar flex-1 border rounded-md bg-card overflow-auto focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <EditorContent editor={editor} className="h-full" />
            </div>

            {/* Footer with stats */}
            <div className="flex justify-end gap-6 text-xs text-muted-foreground opacity-80 mt-2">
        <span>{wordCount} words</span>
        <span>{charCount} characters</span>
        <span>{readingTime} min read</span>
        {saveStatus === "saving" && <span className="text-xs">Saving...</span>}
        {saveStatus === "saved" && <span className="text-xs text-green-500">Saved ✅</span>}
      </div>

      {/* Image Crop Modal */}
      {showCropModal && imageToCrop && (
        <ImageCropModal
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropModal(false);
            setImageToCrop(null);
          }}
        />
      )}

      {/* Image Resize Modal */}
      {showResizeModal && selectedImage && (
        <ImageResizeModal
          imageSrc={selectedImage.src}
          currentWidth={selectedImage.width}
          currentHeight={selectedImage.height}
          onResize={handleImageResize}
          onCancel={() => {
            setShowResizeModal(false);
            setSelectedImage(null);
          }}
        />
      )}
    </div>
  );
}

export default NoteTextInput;