export interface RuntimeConfig {
  language: string;
  version: string;
  extension: string;
  displayName: string;
  aliases?: string[];
  monacoLanguage: string;
}

export const RUNTIMES: Record<string, RuntimeConfig> = {
  python: {
    language: 'python',
    version: '3.10.0',
    extension: '.py',
    displayName: 'Python',
    aliases: ['py'],
    monacoLanguage: 'python'
  },
  javascript: {
    language: 'javascript',
    version: '18.15.0',
    extension: '.js',
    displayName: 'JavaScript',
    aliases: ['js'],
    monacoLanguage: 'javascript'
  },
  typescript: {
    language: 'typescript',
    version: '5.0.3',
    extension: '.ts',
    displayName: 'TypeScript',
    aliases: ['ts'],
    monacoLanguage: 'typescript'
  },
  java: {
    language: 'java',
    version: '15.0.2',
    extension: '.java',
    displayName: 'Java',
    monacoLanguage: 'java'
  },
  c: {
    language: 'c',
    version: '10.2.0',
    extension: '.c',
    displayName: 'C',
    monacoLanguage: 'c'
  },
  cpp: {
    language: 'cpp',
    version: '10.2.0',
    extension: '.cpp',
    displayName: 'C++',
    aliases: ['c++', 'cxx'],
    monacoLanguage: 'cpp'
  },
  csharp: {
    language: 'csharp',
    version: '6.12.0',
    extension: '.cs',
    displayName: 'C#',
    aliases: ['cs', 'c#'],
    monacoLanguage: 'csharp'
  },
  go: {
    language: 'go',
    version: '1.16.2',
    extension: '.go',
    displayName: 'Go',
    aliases: ['golang'],
    monacoLanguage: 'go'
  },
  rust: {
    language: 'rust',
    version: '1.68.2',
    extension: '.rs',
    displayName: 'Rust',
    monacoLanguage: 'rust'
  },
  ruby: {
    language: 'ruby',
    version: '3.0.1',
    extension: '.rb',
    displayName: 'Ruby',
    aliases: ['rb'],
    monacoLanguage: 'ruby'
  },
  php: {
    language: 'php',
    version: '8.2.3',
    extension: '.php',
    displayName: 'PHP',
    monacoLanguage: 'php'
  },
  swift: {
    language: 'swift',
    version: '5.3.3',
    extension: '.swift',
    displayName: 'Swift',
    monacoLanguage: 'swift'
  },
  kotlin: {
    language: 'kotlin',
    version: '1.8.20',
    extension: '.kt',
    displayName: 'Kotlin',
    monacoLanguage: 'kotlin'
  },
  perl: {
    language: 'perl',
    version: '5.36.0',
    extension: '.pl',
    displayName: 'Perl',
    monacoLanguage: 'perl'
  },
  lua: {
    language: 'lua',
    version: '5.4.4',
    extension: '.lua',
    displayName: 'Lua',
    monacoLanguage: 'lua'
  },
  r: {
    language: 'r',
    version: '4.1.1',
    extension: '.r',
    displayName: 'R',
    monacoLanguage: 'r'
  }
};

export function getRuntime(lang: string): RuntimeConfig | undefined {
  const normalized = lang.toLowerCase();
  
  // Direct match
  if (RUNTIMES[normalized]) {
    return RUNTIMES[normalized];
  }
  
  // Check aliases
  for (const runtime of Object.values(RUNTIMES)) {
    if (runtime.aliases?.includes(normalized)) {
      return runtime;
    }
  }
  
  return undefined;
}

export function getRuntimeVersion(lang: string): string {
  const runtime = getRuntime(lang);
  return runtime?.version || '';
}

export function getFileExtension(lang: string): string {
  const runtime = getRuntime(lang);
  return runtime?.extension || '.txt';
}

export function getSupportedLanguages(): string[] {
  return Object.keys(RUNTIMES);
}

export function isLanguageSupported(lang: string): boolean {
  return getRuntime(lang) !== undefined;
}

export function getPistonConfig(lang: string): { language: string; version: string } | null {
  const runtime = getRuntime(lang);
  if (!runtime) return null;
  
  return {
    language: runtime.language,
    version: runtime.version
  };
}

export function getMonacoLanguageId(lang: string): string {
  const runtime = getRuntime(lang);
  return runtime?.monacoLanguage || 'plaintext';
}

export function detectLanguageFromExtension(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  
  for (const [key, runtime] of Object.entries(RUNTIMES)) {
    if (runtime.extension === ext) {
      return key;
    }
  }
  
  return 'plaintext';
}
