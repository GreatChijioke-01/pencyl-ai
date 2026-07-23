import {
  Folder, FileCode, FileJson, Palette, FileText, Image, 
  Settings, Code, Terminal, Wrench, GitBranch, File
} from 'lucide-react';

export default function getFileIcon(name: string, isDirectory: boolean) {
  if (isDirectory) return <Folder size={14} />;

  const ext = name.split('.').pop()?.toLowerCase() ?? '';

  switch (ext) {
    // TypeScript
    case 'ts':
    case 'tsx':
      return <FileCode size={14} className="text-blue-400" />;

    // JSON
    case 'json':
      return <FileJson size={14} className="text-yellow-400" />;

    // CSS & Styling
    case 'css':
    case 'scss':
    case 'less':
      return <Palette size={14} className="text-purple-400" />;
    
    // Markdown
    case 'md':
    case 'markdown':
      return <FileText size={14} className="text-neutral-400" />;

    // Text 
    case 'txt':
    case 'log':
      return <FileText size={14} className="text-neutral-400" />;
    
    // Images & animations
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return <Image size={14} className="text-green-400" />;
    
    // JavaScript
    case 'js':
    case 'jsx':
    case 'mjs':
      return <FileCode size={14} className="text-yellow-400" />;

    // Python
    case 'py':
    case 'pyw':
      return <FileCode size={14} className="text-blue-400" />;

    // Rust
    case 'rs':
      return <FileCode size={14} className="text-orange-400" />;

    // HTML / Web
    case 'html':
    case 'htm':
      return <Code size={14} className="text-red-400" />;

    // Systems (C / C++ / C#)
    case 'c':
    case 'cpp':
    case 'h':
    case 'hpp':
    case 'cs':
      return <Settings size={14} className="text-blue-400" />;

    // Java & Kotlin
    case 'java':
    case 'kt':
      return <FileCode size={14} className="text-red-400" />;

    // Shell Scripts / Terminal Configs
    case 'sh':
    case 'bash':
    case 'zsh':
      return <Terminal size={14} className="text-green-400" />;

    // Config files (YAML / TOML / ENV)
    case 'yaml':
    case 'yml':
    case 'toml':
    case 'ini':
    case 'env':
      return <Wrench size={14} className="text-gray-400" />;
    
    // Git-related files
    case 'gitignore':
    case 'gitattributes':
      return <GitBranch size={14} className="text-orange-400" />;
    
    default:
      return <File size={14} className="text-neutral-400" />;
  }
}
