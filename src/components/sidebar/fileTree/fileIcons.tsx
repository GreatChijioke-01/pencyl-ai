export default function getFileIcon(name: string, isDirectory: boolean) {
  if (isDirectory) return (<span aria-hidden>📁</span>);

  const ext = name.split('.').pop()?.toLowerCase() ?? '';

  switch (ext) {
    // TypeScript
    case 'ts':
    case 'tsx':
      return (<span aria-hidden>🟦</span>);

    // JSON
    case 'json':
      return (<span aria-hidden>{'{}'}</span>);

    // CSS & Styling
    case 'css':
    case 'scss':
    case 'less':
      return (<span aria-hidden>🎨</span>);
    
    // Markdown
    case 'md':
    case 'markdown':
      return (<span aria-hidden>📝</span>);

    // Text 
    case 'txt':
    case 'log':
      return (<span aria-hidden>📄</span>);
    
    // Images & animations
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return (<span aria-hidden>🖼️</span>);
    
    // JavaScript
    case 'js':
    case 'jsx':
    case 'mjs':
      return (<span aria-hidden>🟨</span>);

    // Python
    case 'py':
    case 'pyw':
      return (<span aria-hidden>🐍</span>);

    // Rust
    case 'rs':
      return (<span aria-hidden>🦀</span>);

    // HTML / Web
    case 'html':
    case 'htm':
      return (<span aria-hidden>🌐</span>);

    // Systems (C / C++ / C#)
    case 'c':
    case 'cpp':
    case 'h':
    case 'hpp':
    case 'cs':
      return (<span aria-hidden>⚙️</span>);

    // Java & Kotlin
    case 'java':
    case 'kt':
      return (<span aria-hidden>☕</span>);

    // Shell Scripts / Terminal Configs
    case 'sh':
    case 'bash':
    case 'zsh':
      return (<span aria-hidden>💻</span>);

    // Config files (YAML / TOML / ENV)
    case 'yaml':
    case 'yml':
    case 'toml':
    case 'ini':
    case 'env':
      return (<span aria-hidden>🔧</span>);
    
    // Git-related files
    case 'gitignore':
    case 'gitattributes':
      return (<span aria-hidden>🌿</span>);
    
    default:
      return (<span aria-hidden>📄</span>);
  }
}
