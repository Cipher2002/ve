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
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        
        editorRef.current.innerHTML = content;
        
        // Restore selection if it existed
        if (range && selection) {
          try {
            selection.removeAllRanges();
            selection.addRange(range);
          } catch (e) {
            // Selection restoration failed, ignore
          }
        }
      }
    }, [content]);

    const handleInput = () => {
      if (editorRef.current) {
        let content = editorRef.current.innerHTML;
        
        // Clean up empty content and standalone br tags
        if (content === '<br>' || content === '<div><br></div>' || content.trim() === '') {
          content = '';
          editorRef.current.innerHTML = '';
        }
        
        // Replace <div> tags with line breaks for cleaner HTML
        content = content.replace(/<div>/g, '\n').replace(/<\/div>/g, '');
        content = content.replace(/\n\n/g, '\n'); // Remove double line breaks
        
        onChange(content);
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
        className={`min-h-[60px] bg-transparent p-2 text-foreground outline-none focus:outline-none ${className}`}
        style={{ whiteSpace: 'pre-wrap' }}
        data-placeholder={placeholder}
      />
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';