import React, { useRef, useEffect, useState } from 'react';

interface RichTextEditorMethods {
  applyFormatting: (command: string, value?: string) => void;
  focus: () => void;
}

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  onSelectionChange?: (selection: { start: number; end: number; selectedText: string }) => void;
}

export const RichTextEditor = React.forwardRef<RichTextEditorMethods, RichTextEditorProps>(
  ({ content, onChange, placeholder = "Enter your text here...", className = "", onSelectionChange }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [lastSelection, setLastSelection] = useState<Range | null>(null);

    useEffect(() => {
        if (editorRef.current && content !== editorRef.current.innerHTML) {
        const selection = window.getSelection();
        let savedRange: Range | null = null;
        
        // Save current selection position
        if (selection && selection.rangeCount > 0 && document.activeElement === editorRef.current) {
            savedRange = selection.getRangeAt(0).cloneRange();
        }
        
        editorRef.current.innerHTML = content;
        
        // Restore selection if we saved one and the editor is focused
        if (savedRange && selection && document.activeElement === editorRef.current) {
            try {
            // Ensure the range is still valid after content change
            if (savedRange.startContainer.parentNode && savedRange.endContainer.parentNode) {
                selection.removeAllRanges();
                selection.addRange(savedRange);
            } else {
                // If range is invalid, position cursor at the end
                const range = document.createRange();
                range.selectNodeContents(editorRef.current);
                range.collapse(false); // Collapse to end
                selection.removeAllRanges();
                selection.addRange(range);
            }
            } catch (e) {
            // Selection restoration failed, position at end
            try {
                const range = document.createRange();
                range.selectNodeContents(editorRef.current);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            } catch (e2) {
                // Ignore if this also fails
            }
            }
        }
        }
    }, [content]);

    const handleFocus = () => {
        // When the editor gains focus, ensure cursor is positioned properly
        const selection = window.getSelection();
        if (selection && editorRef.current) {
        // If no selection exists, position cursor at the end
        if (selection.rangeCount === 0) {
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false); // Position at end
            selection.addRange(range);
        }
        }
    };

    const handleInput = () => {
      if (editorRef.current) {
        // Save cursor position before processing
        const selection = window.getSelection();
        const savedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
        
        let content = editorRef.current.innerHTML;
        
        // Clean up empty content and standalone br tags
        if (content === '<br>' || content === '<div><br></div>' || content.trim() === '') {
          content = '';
          editorRef.current.innerHTML = '';
        } else {
          // Replace <div> tags with line breaks for cleaner HTML
          content = content.replace(/<div>/g, '\n').replace(/<\/div>/g, '');
          content = content.replace(/\n\n/g, '\n'); // Remove double line breaks
        }
        
        onChange(content);
        
        // Don't restore selection here - let the useEffect handle it
      }
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        setLastSelection(range.cloneRange());
        
        if (onSelectionChange) {
          const selectedText = selection.toString();
          onSelectionChange({
            start: range.startOffset,
            end: range.endOffset,
            selectedText
          });
        }
      }
    };

    const applyFormatting = (command: string, value?: string) => {
      // Restore selection if we have one
      if (lastSelection) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(lastSelection);
        }
      }

      document.execCommand(command, false, value);
      
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    };

    // Expose formatting methods to parent component
    React.useImperativeHandle(ref, () => ({
      applyFormatting,
      focus: () => editorRef.current?.focus()
    }));

    return (
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        onFocus={handleFocus}
        className={`min-h-[60px] bg-transparent p-2 text-foreground outline-none focus:outline-none ${className}`}
        style={{ whiteSpace: 'pre-wrap' }}
        data-placeholder={placeholder}
      />
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';