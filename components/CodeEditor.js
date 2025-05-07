import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import AceEditor to avoid SSR issues
const AceEditor = dynamic(
  async () => {
    const ace = await import('react-ace');
    // Import necessary modes and themes
    await import('ace-builds/src-noconflict/mode-python');
    await import('ace-builds/src-noconflict/mode-javascript');
    await import('ace-builds/src-noconflict/theme-github');
    await import('ace-builds/src-noconflict/theme-monokai');
    await import('ace-builds/src-noconflict/ext-language_tools');
    return ace.default;
  },
  { ssr: false }
);

/**
 * A reusable code editor component using Ace Editor
 * 
 * @param {Object} props - Component props
 * @param {string} props.code - The code to display in the editor
 * @param {Function} props.onChange - Function to call when code changes
 * @param {string} props.language - Programming language (default: 'python')
 * @param {string} props.theme - Editor theme (default: 'github')
 * @param {string} props.height - Editor height (default: '400px')
 * @param {boolean} props.readOnly - Whether the editor is read-only (default: false)
 * @param {Object} props.options - Additional Ace Editor options
 */
export default function CodeEditor({
  code = '',
  onChange,
  language = 'python',
  theme = 'github',
  height = '400px',
  readOnly = false,
  options = {}
}) {
  const [mounted, setMounted] = useState(false);
  const [editorInstance, setEditorInstance] = useState(null);

  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle code change
  const handleCodeChange = (newCode) => {
    if (onChange) {
      onChange(newCode);
    }
  };

  // Handle editor load
  const onLoad = (editor) => {
    setEditorInstance(editor);
    
    // Set editor options
    editor.setOptions({
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      enableSnippets: true,
      showLineNumbers: true,
      tabSize: 4,
      ...options
    });
    
    // Focus the editor
    editor.focus();
  };

  // Python-specific completions
  const getPythonCompletions = () => {
    return [
      {
        name: 'generate_questions',
        value: 'generate_questions',
        meta: 'function',
        score: 1000
      },
      {
        name: 'import',
        value: 'import ',
        meta: 'keyword',
        score: 900
      },
      {
        name: 'def',
        value: 'def ',
        meta: 'keyword',
        score: 900
      },
      {
        name: 'return',
        value: 'return ',
        meta: 'keyword',
        score: 900
      },
      {
        name: 'if',
        value: 'if ',
        meta: 'keyword',
        score: 900
      },
      {
        name: 'else',
        value: 'else:',
        meta: 'keyword',
        score: 900
      },
      {
        name: 'for',
        value: 'for ',
        meta: 'keyword',
        score: 900
      },
      {
        name: 'while',
        value: 'while ',
        meta: 'keyword',
        score: 900
      },
      {
        name: 'random',
        value: 'random',
        meta: 'module',
        score: 800
      },
      {
        name: 'numpy',
        value: 'numpy',
        meta: 'module',
        score: 800
      },
      {
        name: 'pandas',
        value: 'pandas',
        meta: 'module',
        score: 800
      }
    ];
  };

  if (!mounted) {
    return (
      <div 
        style={{ 
          height, 
          width: '100%', 
          backgroundColor: '#f5f5f5', 
          border: '1px solid #ddd',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div>Loading editor...</div>
      </div>
    );
  }

  return (
    <AceEditor
      mode={language}
      theme={theme}
      name="code-editor"
      fontSize={14}
      width="100%"
      height={height}
      value={code}
      onChange={handleCodeChange}
      onLoad={onLoad}
      readOnly={readOnly}
      editorProps={{ $blockScrolling: true }}
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showLineNumbers: true,
        tabSize: 4,
        ...options
      }}
      className="font-mono border border-gray-300 rounded-md"
    />
  );
}
