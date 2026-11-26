import { useState, useEffect } from 'react';

// Follows the app theme (the `light` class on <html>), so the editor matches the page
export function useLightTheme() {
  const read = () => document.documentElement.classList.contains('light');
  const [light, setLight] = useState(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setLight(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return light;
}

// Monaco theme on the ink ramp: the editor sits on the card surface, keywords take the brand shade.
export function defineEditorTheme(monaco) {
  monaco.editor.defineTheme('daily-commit', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'dde1e9' },
      { token: 'comment', foreground: '767e92' },
      { token: 'comment.doc', foreground: '767e92' },
      { token: 'delimiter.bracket', foreground: 'a3a9b8' },
      { token: 'keyword', foreground: '4d8eff' },
      { token: 'string', foreground: 'd9a441' },
      { token: 'number', foreground: 'd9a441' },
      { token: 'type', foreground: 'a3a9b8' },
      { token: 'delimiter', foreground: 'a3a9b8' },
    ],
    colors: {
      'editor.background': '#11141c',
      'editor.foreground': '#dde1e9',
      'editorLineNumber.foreground': '#4b5565',
      'editorLineNumber.activeForeground': '#a3a9b8',
      'editor.lineHighlightBackground': '#1a1e28',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#0066ff40',
      'editor.inactiveSelectionBackground': '#0066ff22',
      'editorCursor.foreground': '#eef0f5',
      'editorIndentGuide.background1': '#1a1e28',
      'editorWidget.background': '#1a1e28',
      'editorWidget.border': '#eef0f514',
      'editorSuggestWidget.background': '#1a1e28',
      'editorSuggestWidget.border': '#eef0f514',
      'editorSuggestWidget.selectedBackground': '#232838',
      'scrollbarSlider.background': '#eef0f514',
      'scrollbarSlider.hoverBackground': '#eef0f524',
      'scrollbarSlider.activeBackground': '#eef0f530',
    },
  });
  // The same roles on the light ramp, on the white card
  monaco.editor.defineTheme('daily-commit-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: '', foreground: '111827' },
      { token: 'comment', foreground: '6b7487' },
      { token: 'comment.doc', foreground: '6b7487' },
      { token: 'delimiter.bracket', foreground: '4b5565' },
      { token: 'keyword', foreground: '0052e0' },
      { token: 'string', foreground: '9a6700' },
      { token: 'number', foreground: '9a6700' },
      { token: 'type', foreground: '4b5565' },
      { token: 'delimiter', foreground: '4b5565' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#111827',
      'editorLineNumber.foreground': '#a3a9b8',
      'editorLineNumber.activeForeground': '#4b5565',
      'editor.lineHighlightBackground': '#f5f7fa',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#0066ff2e',
      'editor.inactiveSelectionBackground': '#0066ff18',
      'editorCursor.foreground': '#111827',
      'editorIndentGuide.background1': '#eceff4',
      'editorWidget.background': '#ffffff',
      'editorWidget.border': '#11182724',
      'editorSuggestWidget.background': '#ffffff',
      'editorSuggestWidget.border': '#11182724',
      'editorSuggestWidget.selectedBackground': '#eceff4',
      'scrollbarSlider.background': '#11182714',
      'scrollbarSlider.hoverBackground': '#11182724',
      'scrollbarSlider.activeBackground': '#11182730',
    },
  });
}
