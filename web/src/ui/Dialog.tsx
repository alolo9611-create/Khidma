import { useEffect, useId, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface Props {
  title: string; subtitle?: ReactNode; icon: IconName; tone: 'info' | 'ok' | 'bad' | 'primary';
  onClose(): void; children: ReactNode; footer: ReactNode; maxWidth?: number;
}
const TONE = {
  info: { background: '#FCEFD9', color: '#8A4B00' }, ok: { background: '#E3F2E8', color: '#17663E' },
  bad: { background: '#FBE9E7', color: '#A3261C' }, primary: { background: '#E6F0ED', color: '#0E5A4B' },
};

export function Dialog({ title, subtitle, icon, tone, onClose, children, footer, maxWidth }: Props) {
  const id = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="k-overlay">
      <div className="k-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <section className="k-dialog" role="dialog" aria-modal="true" aria-labelledby={id} style={maxWidth ? { maxWidth } : undefined}>
          <div className="k-dialog-head">
            <span className="k-dialog-icon" style={TONE[tone]}><Icon name={icon} /></span>
            <div style={{ flex: 1, paddingTop: 2 }}>
              <h2 className="k-h2" id={id}>{title}</h2>
              {subtitle && <span className="k-small k-muted">{subtitle}</span>}
            </div>
            <button className="k-icon-btn" type="button" aria-label="Close" onClick={onClose}><Icon name="x" /></button>
          </div>
          <div className="k-dialog-body">{children}</div>
          <div className="k-dialog-foot">{footer}</div>
        </section>
      </div>
    </div>
  );
}
