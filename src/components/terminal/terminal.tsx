import PtyTerminal from './PtyTerminal';

interface TerminalProps {
  cwd?: string;
}

export default function Terminal({ cwd }: TerminalProps) {
  return (
    <div style={{height: '100%', width: '100%', overflow: 'hidden'}}>
      <PtyTerminal cwd={cwd} />
    </div>
  );
}
