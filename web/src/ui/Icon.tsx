import type { CSSProperties } from 'react';

// Icon paths copied from the design artboards (inline SVG, stroke icons).
const PATHS: Record<string, string[]> = {
  bell: ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'M10.3 21a1.94 1.94 0 0 0 3.4 0'],
  check: ['M20 6 9 17l-5-5'],
  alertCircle: ['circle:12,12,10', 'M12 8v4', 'M12 16h.01'],
  chevronDown: ['m6 9 6 6 6-6'],
  chevronRight: ['m9 18 6-6-6-6'],
  alertTriangle: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'],
  lock: ['rect:3,11,18,11,2', 'M7 11V7a5 5 0 0 1 10 0v4'],
  checkCircle: ['circle:12,12,10', 'm9 12 2 2 4-4'],
  fileCheck: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v4a2 2 0 0 0 2 2h4', 'm9 15 2 2 4-4'],
  fileText: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v4a2 2 0 0 0 2 2h4', 'M16 13H8', 'M16 17H8'],
  fileAlert: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v4a2 2 0 0 0 2 2h4', 'M12 12v3', 'M12 18h.01'],
  send: ['m22 2-7 20-4-9-9-4Z', 'M22 2 11 13'],
  clock: ['circle:12,12,10', 'M12 6v6l4 2'],
  info: ['circle:12,12,10', 'M12 16v-4', 'M12 8h.01'],
  message: ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  xCircle: ['circle:12,12,10', 'm15 9-6 6', 'm9 9 6 6'],
  undo: ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5'],
  userCheck: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'circle:9,7,4', 'm16 11 2 2 4-4'],
  userPlus: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'circle:9,7,4', 'M19 8v6', 'M22 11h-6'],
  search: ['circle:11,11,8', 'm21 21-4.3-4.3'],
  copy: ['rect:8,8,14,14,2', 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'],
  inbox: ['M22 12h-6l-2 3h-4l-2-3H2', 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  arrowLeft: ['m12 19-7-7 7-7', 'M19 12H5'],
  arrowRight: ['M5 12h14', 'm12 5 7 7-7 7'],
  award: ['circle:12,8,6', 'M15.48 12.89 17 22l-5-3-5 3 1.52-9.11'],
  edit: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'],
  plus: ['M5 12h14', 'M12 5v14'],
  eye: ['M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z', 'circle:12,12,3'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  shield: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'],
};
export type IconName = keyof typeof PATHS;

export function Icon({ name, small, style }: { name: IconName; small?: boolean; style?: CSSProperties }) {
  return (
    <svg className={small ? 'k-ico k-ico-sm' : 'k-ico'} viewBox="0 0 24 24" aria-hidden="true" style={style}>
      {PATHS[name].map((d, i) => {
        if (d.startsWith('circle:')) { const [cx, cy, r] = d.slice(7).split(','); return <circle key={i} cx={cx} cy={cy} r={r} />; }
        if (d.startsWith('rect:')) { const [x, y, w, h, rx] = d.slice(5).split(','); return <rect key={i} x={x} y={y} width={w} height={h} rx={rx} />; }
        return <path key={i} d={d} />;
      })}
    </svg>
  );
}
