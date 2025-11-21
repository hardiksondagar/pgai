import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import EditorToolbar from './EditorToolbar';
import { databaseAPI } from '../../services/api';

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: (query: string) => void;
  onFormat: (query: string) => void;
  onSaveFavorite?: () => void;
  onShowHistory?: () => void;
  onShowFavorites?: () => void;
  isExecuting: boolean;
  theme?: 'light' | 'dark';
  connectionId?: number;
}

const SQLEditor: React.FC<SQLEditorProps> = ({
  value,
  onChange,
  onExecute,
  onFormat,
  onSaveFavorite,
  onShowHistory,
  onShowFavorites,
  isExecuting,
  theme = 'dark',
  connectionId,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [autocompleteData, setAutocompleteData] = useState<any>(null);
  const completionProviderRef = useRef<any>(null);

  // Load autocomplete data when connection changes
  useEffect(() => {
    if (connectionId) {
      loadAutocompleteData();
    }
  }, [connectionId]);

  const loadAutocompleteData = async () => {
    if (!connectionId) return;

    try {
      const response = await databaseAPI.getAutocomplete(connectionId);
      setAutocompleteData(response.data);
    } catch (error) {
      console.error('Failed to load autocomplete data:', error);
    }
  };

  // Update theme when it changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme === 'dark' ? 'custom-dark' : 'vs-light');
    }
  }, [theme]);

  // Register autocomplete provider when data is available
  useEffect(() => {
    if (monacoRef.current && autocompleteData) {
      registerAutocompleteProvider();
    }
  }, [autocompleteData]);

  const registerAutocompleteProvider = () => {
    if (!monacoRef.current || !autocompleteData) return;

    const monaco = monacoRef.current;

    // Dispose previous provider if it exists
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
    }

    // Register new completion provider
    completionProviderRef.current = monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: any[] = [];

        // Add table suggestions
        autocompleteData.tables?.forEach((table: string) => {
          suggestions.push({
            label: table,
            kind: monaco.languages.CompletionItemKind.Class,
            detail: 'Table',
            insertText: table,
            range: range,
          });
        });

        // Add column suggestions
        Object.entries(autocompleteData.columns || {}).forEach(([table, columns]: [string, any]) => {
          (columns as string[]).forEach((column: string) => {
            suggestions.push({
              label: `${table}.${column}`,
              kind: monaco.languages.CompletionItemKind.Field,
              detail: `Column in ${table}`,
              insertText: column,
              range: range,
            });
          });
        });

        // Add SQL keywords
        const keywords = [
          'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
          'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'UPDATE',
          'DELETE', 'CREATE', 'ALTER', 'DROP', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN',
          'LIKE', 'IS NULL', 'IS NOT NULL', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG',
          'MIN', 'MAX', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'
        ];

        keywords.forEach((keyword) => {
          suggestions.push({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            detail: 'SQL Keyword',
            insertText: keyword,
            range: range,
          });
        });

        return { suggestions };
      },
    });
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom dark theme to match app colors
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#111827', // gray-900 to match app
        'editor.lineHighlightBackground': '#1f2937', // gray-800
        'editorLineNumber.foreground': '#6b7280', // gray-500
        'editorLineNumber.activeForeground': '#9ca3af', // gray-400
      }
    });

    // Set the theme immediately after defining it
    monaco.editor.setTheme(theme === 'dark' ? 'custom-dark' : 'vs-light');

    // Add keyboard shortcuts
    editor.addAction({
      id: 'execute-query',
      label: 'Execute Query',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        const selection = editor.getSelection();
        const selectedText = editor.getModel()?.getValueInRange(selection);
        onExecute(selectedText || value);
      },
    });

    editor.addAction({
      id: 'format-sql',
      label: 'Format SQL',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
      run: () => {
        onFormat(value);
      },
    });
  };

  const handleExecuteClick = () => {
    const editor = editorRef.current;
    if (editor) {
      const selection = editor.getSelection();
      const selectedText = editor.getModel()?.getValueInRange(selection);
      onExecute(selectedText || value);
    } else {
      onExecute(value);
    }
  };

  const handleFormatClick = () => {
    onFormat(value);
  };

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar
        onExecute={handleExecuteClick}
        onFormat={handleFormatClick}
        onSaveFavorite={onSaveFavorite}
        onShowHistory={onShowHistory}
        onShowFavorites={onShowFavorites}
        isExecuting={isExecuting}
      />

      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={value}
          onChange={(newValue) => onChange(newValue || '')}
          onMount={handleEditorDidMount}
          theme={theme === 'dark' ? 'custom-dark' : 'vs-light'}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
          }}
        />
      </div>
    </div>
  );
};

export default SQLEditor;

