import React, { useCallback, useEffect, useRef } from 'react';
import { $getRoot, $getSelection, $isRangeSelection, TextNode, $createTextNode, LexicalEditor } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';

interface TextElement {
  id: string;
  text: string;
  editable: boolean;
}

interface LexicalTextEditorProps {
  content: string | { elements: TextElement[] } | { editorState: any };
  onChange: (content: { editorState: any }) => void;
  placeholder?: string;
  className?: string;
  onSelectionChange?: (selection: { start: number; end: number; selectedText: string }) => void;
}

// Plugin to handle content updates
function UpdateContentPlugin({ content, onChange, editorRef }: { 
  content: string | { elements: TextElement[] } | { editorState: any }; 
  onChange: (content: { editorState: any }) => void;
  editorRef?: React.MutableRefObject<LexicalEditor | null>;
}) {
  const [editor] = useLexicalComposerContext();
  const isUserTypingRef = useRef(false);

  // Store editor reference for parent component
  React.useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // Update editor content when prop changes
  useEffect(() => {
    if (isUserTypingRef.current) return;
    
    editor.update(() => {
      try {
        if (typeof content === 'object' && 'editorState' in content && content.editorState) {
          const editorState = editor.parseEditorState(content.editorState);
          editor.setEditorState(editorState);
        } else if (typeof content === 'object' && 'elements' in content && content.elements) {
          // Handle multi-element content - convert to plain text for now
          const root = $getRoot();
          root.clear();
          const combinedText = content.elements.map(el => el.text).join(' ');
          if (combinedText) {
            const parser = new DOMParser();
            const dom = parser.parseFromString(combinedText, 'text/html');
            const nodes = $generateNodesFromDOM(editor, dom);
            root.append(...nodes);
          }
        } else if (typeof content === 'string' && content) {
          // Convert HTML string to Lexical nodes for backward compatibility
          const root = $getRoot();
          root.clear();
          const parser = new DOMParser();
          const dom = parser.parseFromString(content, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          root.append(...nodes);
        }
      } catch (error) {
        console.error('Error updating editor content:', error);
      }
    });
  }, [content, editor]);

  // Handle content changes
  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      if (!isUserTypingRef.current) {
        isUserTypingRef.current = true;
        const serializedState = editorState.toJSON();
        onChange({ editorState: serializedState });
        
        setTimeout(() => {
          isUserTypingRef.current = false;
        }, 100);
      }
    });

    return removeUpdateListener;
  }, [editor, onChange]);

  return null;
}

// Plugin to handle formatting commands
function FormattingPlugin() {
  const [editor] = useLexicalComposerContext();

  const applyFormatting = useCallback((command: string, value?: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      switch (command) {
        case 'bold':
          selection.formatText('bold');
          break;
        case 'italic':
          selection.formatText('italic');
          break;
        case 'underline':
          selection.formatText('underline');
          break;
        case 'foreColor':
          if (value) {
            selection.getNodes().forEach(node => {
              if (node instanceof TextNode) {
                node.setStyle(`color: ${value}`);
              }
            });
          }
          break;
        case 'fontFamily':
          if (value) {
            selection.getNodes().forEach(node => {
              if (node instanceof TextNode) {
                const currentStyle = node.getStyle() || '';
                const newStyle = currentStyle.replace(/font-family:[^;]*(;|$)/, '') + 
                  (currentStyle && !currentStyle.endsWith(';') ? ';' : '') + `font-family: ${value};`;
                node.setStyle(newStyle);
              }
            });
          }
          break;
        case 'fontSize':
          if (value) {
            selection.getNodes().forEach(node => {
              if (node instanceof TextNode) {
                const currentStyle = node.getStyle() || '';
                const newStyle = currentStyle.replace(/font-size:[^;]*(;|$)/, '') + 
                  (currentStyle && !currentStyle.endsWith(';') ? ';' : '') + `font-size: ${value};`;
                node.setStyle(newStyle);
              }
            });
          }
          break;
      }
    });
  }, [editor]);

  // Expose formatting function globally
  useEffect(() => {
    const handleFormat = (event: CustomEvent) => {
      const { command, value } = event.detail;
      applyFormatting(command, value);
    };

    window.addEventListener('lexical-format', handleFormat as EventListener);
    return () => window.removeEventListener('lexical-format', handleFormat as EventListener);
  }, [applyFormatting]);

  return null;
}

export const LexicalTextEditor = React.forwardRef<any, LexicalTextEditorProps>(
  ({ content, onChange, placeholder = "Enter your text here...", className = "", onSelectionChange }, ref) => {
    const initialConfig = {
      namespace: 'TextEditor',
      theme: {
        paragraph: 'editor-paragraph',
        text: {
          bold: 'editor-text-bold',
          italic: 'editor-text-italic',
          underline: 'editor-text-underline',
        },
      },
      onError: (error: Error) => {
        console.error('Lexical error:', error);
      },
      nodes: [],
    };

    const applyFormatting = useCallback((command: string, value?: string) => {
      window.dispatchEvent(new CustomEvent('lexical-format', {
        detail: { command, value }
      }));
    }, []);

    // Store editor reference for accessing it in imperative methods
    const editorRef = React.useRef(null);

    // Expose methods to parent
    React.useImperativeHandle(ref, () => ({
      applyFormatting,
      focus: () => {
        // Will implement focus logic
      },
      getHTML: () => {
      // Fallback method - get HTML from the contentEditable element
      const contentEditableElement = document.querySelector('[contenteditable="true"]');
      if (contentEditableElement) {
        return contentEditableElement.innerHTML;
      }
      return '';
    },
      editor: editorRef.current
    }));

    return (
      <LexicalComposer initialConfig={initialConfig}>
        <div className={`relative ${className}`}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="min-h-[60px] bg-transparent p-2 text-foreground outline-none focus:outline-none"
                aria-placeholder={placeholder}
                placeholder={
                  <div className="absolute top-2 left-2 text-muted-foreground pointer-events-none select-none">
                    {placeholder}
                  </div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <UpdateContentPlugin content={content} onChange={onChange} editorRef={editorRef} />
          <FormattingPlugin />
        </div>
      </LexicalComposer>
    );
  }
);

LexicalTextEditor.displayName = 'LexicalTextEditor';