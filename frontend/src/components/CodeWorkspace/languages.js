// The editor's languages, Python first

export const SUPPORTED_LANGUAGES = [
  { id: 'python', label: 'Python', detail: 'Python 3, runs in your browser', monacoLang: 'python' },
  { id: 'cpp', label: 'C++', detail: 'GCC 10', monacoLang: 'cpp' },
  { id: 'java', label: 'Java', detail: 'OpenJDK 15', monacoLang: 'java' },
  { id: 'javascript', label: 'JavaScript', detail: 'Node.js, runs in your browser', monacoLang: 'javascript' },
];
/** localStorage key for the last language picked */
export const LANGUAGE_KEY = 'codestreak_editor_language';
