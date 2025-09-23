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

    const isTypingRef = useRef(false);
  
  useEffect(() => {
    // Don't update content if user is actively typing
    if (isTypingRef.current) {
      return;
    }
    
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
      isTypingRef.current = true;
      
      // Clear typing flag after a short delay
      setTimeout(() => {
        isTypingRef.current = false;
      }, 100);
      
      let content = editorRef.current.innerHTML;
      
      // Clean up empty content and standalone br tags
      if (content === '<br>' || content === '<div><br></div>' || content.trim() === '') {
        content = '';
        editorRef.current.innerHTML = '';
      } else {
        // Replace <div> tags with <br> for line breaks
        content = content.replace(/<div><br><\/div>/g, '<br>');
        content = content.replace(/<div>/g, '<br>').replace(/<\/div>/g, '');
        // Remove leading <br> if content starts with one
        content = content.replace(/^<br>/, '');
      }
      
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
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      
      if (range.collapsed) return; // No text selected
      
      const selectedText = range.toString();
      if (!selectedText) return;

      // Check if selection is already formatted
      const commonAncestor = range.commonAncestorContainer;
      const parentElement = commonAncestor.nodeType === Node.TEXT_NODE 
        ? commonAncestor.parentElement 
        : commonAncestor as Element;

      let existingFormat: Element | null = null;
      
      // Check for existing formatting
      if (parentElement) {
        switch (command) {
          case 'bold':
            existingFormat = parentElement.closest('strong');
            break;
          case 'italic':
            existingFormat = parentElement.closest('em');
            break;
          case 'underline':
            existingFormat = parentElement.closest('u');
            break;
        }
      }

      try {
        if (existingFormat && ['bold', 'italic', 'underline'].includes(command)) {
          // Remove existing formatting
          const textContent = existingFormat.textContent;
          const textNode = document.createTextNode(textContent || '');
          existingFormat.parentNode?.replaceChild(textNode, existingFormat);
        } else {
          // Apply new formatting
          let wrapper: HTMLElement;
          
          switch (command) {
            case 'bold':
              wrapper = document.createElement('strong');
              break;
            case 'italic':
              wrapper = document.createElement('em');
              break;
            case 'underline':
              wrapper = document.createElement('u');
              break;
            case 'foreColor':
              wrapper = document.createElement('span');
              wrapper.style.color = value || '#000000';
              break;
            case 'fontName':
              wrapper = document.createElement('span');
              wrapper.style.fontFamily = value || 'Arial';
              break;
            case 'fontSize':
              wrapper = document.createElement('span');
              wrapper.style.fontSize = value || '16px';
              break;
            default:
              return;
          }

          // Extract contents of the selection
          const contents = range.extractContents();
          
          // Add contents to wrapper
          wrapper.appendChild(contents);
          
          // Insert wrapper at selection point
          range.insertNode(wrapper);
        }
        
        // Clear selection
        selection.removeAllRanges();
        
        // Update content
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      } catch (error) {
        console.error('Error applying formatting:', error);
      }
    };

  // Expose formatting methods to parent component
  React.useImperativeHandle(ref, () => ({
    applyFormatting,
    focus: () => editorRef.current?.focus()
  }));

    const handleKeyDown = (e: React.KeyboardEvent) => {
    isTypingRef.current = true;
    
    // Handle Enter key to insert <br> instead of <div>
    if (e.key === 'Enter') {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const br = document.createElement('br');
        range.insertNode(br);
        range.setStartAfter(br);
        range.setEndAfter(br);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      handleInput();
    }
  };

  const handleKeyUp = () => {
    // Keep typing flag for a bit longer on keyup
    setTimeout(() => {
      isTypingRef.current = false;
    }, 200);
    
    handleSelectionChange();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    handleInput();
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onMouseUp={handleSelectionChange}
      onFocus={handleFocus}
      onPaste={handlePaste}
      className={`min-h-[60px] bg-transparent p-2 text-foreground outline-none focus:outline-none ${className}`}
      style={{ whiteSpace: 'pre-wrap' }}
      data-placeholder={placeholder}
    />
  );
}
);

RichTextEditor.displayName = 'RichTextEditor';