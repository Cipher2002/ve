import React, { useCallback, useEffect, useRef } from 'react';
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';

interface LexicalTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  onSelectionChange?: (selection: { start: number; end: number; selectedText: string }) => void;
}

// Plugin to handle content updates
function UpdateContentPlugin({ content, onChange }: { content: string; onChange: (content: string) => void }) {
  const [editor] = useLexicalComposerContext();
  const isUserTypingRef = useRef(false);

  // Update editor content when prop changes
  useEffect(() => {
    if (isUserTypingRef.current) return;
    
    editor.update(() => {
      const root = $getRoot();
      const currentHtml = $generateHtmlFromNodes(editor, null);
      
      if (currentHtml !== content) {
        root.clear();
        
        if (content) {
          const parser = new DOMParser();
          const dom = parser.parseFromString(content, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          root.append(...nodes);
        }
      }
    });
  }, [content, editor]);

  // Handle content changes
  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        isUserTypingRef.current = true;
        const html = $generateHtmlFromNodes(editor, null);
        onChange(html);
        
        setTimeout(() => {
          isUserTypingRef.current = false;
        }, 100);
      });
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
          // Will implement custom color formatting
          break;
        case 'fontFamily':
          // Will implement custom font formatting
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

    // Expose methods to parent
    React.useImperativeHandle(ref, () => ({
      applyFormatting,
      focus: () => {
        // Will implement focus logic
      }
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
          <UpdateContentPlugin content={content} onChange={onChange} />
          <FormattingPlugin />
        </div>
      </LexicalComposer>
    );
  }
);

LexicalTextEditor.displayName = 'LexicalTextEditor';