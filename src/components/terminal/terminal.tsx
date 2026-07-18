import PtyTerminal from './PtyTerminal';

export default function Terminal() {
  return (
    <div style={{height: '100%', width: '100%', overflow: 'hidden'}}>
      <PtyTerminal />
    </div>
  );
}
