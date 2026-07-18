export default function getFileIcon(name: string, isDirectory: boolean) {
  if (isDirectory) return (<span aria-hidden>📁</span>);

  const ext = name.split('.').pop()?.toLowerCase() ?? '';

  switch (ext) {
    case 'ts':
    case 'tsx':
      return (<span aria-hidden>🟦</span>);
    case 'json':
      return (<span aria-hidden>{'{}'}</span>);
    case 'css':
    case 'scss':
    case 'less':
      return (<span aria-hidden>🎨</span>);
    case 'md':
    case 'markdown':
      return (<span aria-hidden>📝</span>);
    case 'txt':
    case 'log':
      return (<span aria-hidden>📄</span>);
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return (<span aria-hidden>🖼️</span>);
    default:
      return (<span aria-hidden>📄</span>);
  }
}
