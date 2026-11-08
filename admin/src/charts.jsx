import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { brl, brlK, ease, pct, softSpring, spring, useWidth } from './ui.jsx';

// Escala "bonita": o topo do eixo é 4 × um passo arredondado (1, 2, 2,5, 5, 10 × 10^n)
export function niceMax(v) {
  if (!v || v <= 0) return 1;
  const raw = v / 4;
  const e = 10 ** Math.floor(Math.log10(raw));
  const n = raw / e;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * e * 4;
}
const roundedTop = (x, y, w, h, r) => {
  if (h <= 0) return `M${x},${y}h${w}`;
  r = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
};
// Curva monotônica (não "ultrapassa" os pontos, como d3.curveMonotoneX)
function monotone(pts) {
  const n = pts.length;
  if (n < 2) return n ? `M${pts[0][0]},${pts[0][1]}` : '';
  const dx = [], dy = [], m = [], t = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; dy[i] = pts[i + 1][1] - pts[i][1]; m[i] = dy[i] / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${pts[i][0] + h},${pts[i][1] + h * t[i]} ${pts[i + 1][0] - h},${pts[i + 1][1] - h * t[i + 1]} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

function Tip({ show, x, y, children, w }) {
  const flip = x > w - 120 ? 'tip-left' : x < 120 ? 'tip-right' : '';
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="tip-anchor" initial={{ opacity: 0, x, y }} animate={{ opacity: 1, x, y }} exit={{ opacity: 0 }} transition={{ ...spring, opacity: { duration: 0.15 } }}>
          <div className={`tip ${flip}`}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- Barras verticais ----------
export function BarChart({ data, height = 240, format = brlK, tipFormat = brl, accentLast = false, extra, valueKey = 'value', onSelect, selected }) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { l: 58, r: 6, t: 14, b: 28 };
  const max = niceMax(Math.max(...data.map((d) => d[valueKey] || 0)));
  const iw = Math.max(0, w - pad.l - pad.r), ih = height - pad.t - pad.b;
  const band = iw / Math.max(1, data.length);
  const bw = Math.max(4, Math.min(44, band * 0.58));
  const y = (v) => pad.t + ih - (ih * v) / max;
  const every = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(iw / 46))));
  const key = data.map((d) => d.label).join('|');
  const hd = hover != null ? data[hover] : null;
  return (
    <div className="chart" ref={ref} style={{ height }} onMouseLeave={() => setHover(null)}>
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label="Gráfico de barras">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={pad.l} x2={w - pad.r} y1={y(f * max)} y2={y(f * max)} className={f === 0 ? 'baseline' : 'grid'} />
              <text x={pad.l - 10} y={y(f * max)} className="axis" textAnchor="end" dominantBaseline="middle">{format(f * max)}</text>
            </g>
          ))}
          <g key={key}>
            {data.map((d, i) => {
              const v = d[valueKey] || 0;
              const h = (ih * v) / max;
              const x = pad.l + band * i + (band - bw) / 2;
              const dim = (hover != null && hover !== i) || (selected != null && selected !== i);
              return (
                <g key={i}>
                  <motion.path
                    d={roundedTop(x, pad.t + ih - h, bw, h, 5)}
                    className={`bar ${(accentLast && i === data.length - 1) || selected === i ? 'bar-accent' : ''}`}
                    style={{ originY: 1, transformBox: 'fill-box' }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: dim ? 0.42 : 1 }}
                    transition={{ scaleY: { ...softSpring, delay: 0.05 + i * 0.03 }, opacity: { duration: 0.2 } }}
                  />
                  {i % every === 0 && <text x={pad.l + band * i + band / 2} y={height - 8} className="axis" textAnchor="middle">{d.label}</text>}
                  <rect x={pad.l + band * i} y={pad.t} width={band} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => onSelect?.(i)} style={{ cursor: onSelect ? 'pointer' : 'default' }} />
                </g>
              );
            })}
          </g>
        </svg>
      )}
      <Tip show={hd != null} w={w} x={hover != null ? pad.l + band * hover + band / 2 : 0} y={hd ? y(hd[valueKey] || 0) - 8 : 0}>
        {hd && <>
          <span className="tip-title">{hd.full || hd.label}{hd.partial ? ' · parcial' : ''}</span>
          <strong>{tipFormat(hd[valueKey] || 0)}</strong>
          {extra?.(hd)}
        </>}
      </Tip>
    </div>
  );
}

// ---------- Área / linha com comparação ao período anterior ----------
export function AreaChart({ points, height = 260, format = brlK, tipFormat = brl, showPrev = true, unitsLabel = 'unidades' }) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { l: 58, r: 12, t: 16, b: 28 };
  const max = niceMax(Math.max(...points.map((p) => Math.max(p.value || 0, showPrev ? p.prev || 0 : 0))));
  const iw = Math.max(0, w - pad.l - pad.r), ih = height - pad.t - pad.b;
  const n = points.length;
  const x = (i) => pad.l + (n <= 1 ? iw / 2 : (iw * i) / (n - 1));
  const y = (v) => pad.t + ih - (ih * v) / max;
  const cur = points.map((p, i) => [x(i), y(p.value || 0), p.value]).filter((p) => p[2] != null);
  const line = monotone(cur);
  const area = cur.length ? `${line}L${cur[cur.length - 1][0]},${pad.t + ih}L${cur[0][0]},${pad.t + ih}Z` : '';
  const prevLine = showPrev ? monotone(points.map((p, i) => [x(i), y(p.prev || 0)])) : '';
  const key = points.map((p) => p.label).join('|') + n;
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 64))));
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - pad.l) / Math.max(1, iw)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };
  const hp = hover != null ? points[hover] : null;
  const gid = useMemo(() => 'ag' + Math.random().toString(36).slice(2, 8), []);
  return (
    <div className="chart" ref={ref} style={{ height }}>
      {w > 0 && (
        <svg width={w} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label="Gráfico de faturamento ao longo do período">
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--s1)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--s1)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={pad.l} x2={w - pad.r} y1={y(f * max)} y2={y(f * max)} className={f === 0 ? 'baseline' : 'grid'} />
              <text x={pad.l - 10} y={y(f * max)} className="axis" textAnchor="end" dominantBaseline="middle">{format(f * max)}</text>
            </g>
          ))}
          {points.map((p, i) => i % every === 0 && <text key={i} x={x(i)} y={height - 8} className="axis" textAnchor={i === 0 && n > 1 ? 'start' : 'middle'}>{p.label}</text>)}
          <g key={key}>
            {showPrev && <motion.path d={prevLine} className="line-prev" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.1, ease }} />}
            <motion.path d={area} fill={`url(#${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.35 }} />
            <motion.path d={line} className="line-main" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease }} />
            {n <= 1 && cur[0] && <circle cx={cur[0][0]} cy={cur[0][1]} r={5} className="dot" />}
          </g>
          {hp && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} className="crosshair" />
              {showPrev && <circle cx={x(hover)} cy={y(hp.prev || 0)} r={4} className="dot-prev" />}
              {hp.value != null && <circle cx={x(hover)} cy={y(hp.value)} r={5} className="dot" />}
            </g>
          )}
        </svg>
      )}
      <Tip show={!!hp} w={w} x={hover != null ? x(hover) : 0} y={hp ? y(Math.max(hp.value || 0, showPrev ? hp.prev || 0 : 0)) - 10 : 0}>
        {hp && <>
          <span className="tip-title">{hp.full || hp.label}</span>
          <strong>{hp.value == null ? '—' : tipFormat(hp.value)}</strong>
          {hp.units != null && <span className="tip-row">{hp.units.toLocaleString('pt-BR')} {unitsLabel}</span>}
          {showPrev && <span className="tip-row muted">Período anterior: {tipFormat(hp.prev || 0)}{hp.value != null && hp.prev ? ` (${hp.value >= hp.prev ? '+' : '−'}${pct(Math.abs(hp.value / hp.prev - 1))})` : ''}</span>}
        </>}
      </Tip>
    </div>
  );
}

export function LegendRow({ items }) {
  return (
    <div className="legend">
      {items.map((it) => (
        <span key={it.label} className="legend-item">
          <i className={`legend-swatch ${it.dashed ? 'dashed' : ''}`} style={{ background: it.dashed ? 'none' : it.color, borderColor: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

// ---------- Rosca ----------
const polar = (cx, cy, r, a) => [cx + r * Math.cos(a - Math.PI / 2), cy + r * Math.sin(a - Math.PI / 2)];
function arc(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
  return `M${x0},${y0}A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1}`;
}
export function Donut({ data, size = 190, thickness = 20, centerLabel = 'total', format = brlK, onSelect, selected }) {
  const [hover, setHover] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const c = size / 2, r = c - thickness / 2 - 4;
  const gap = data.length > 1 ? 0.035 : 0;
  let a = 0;
  const segs = data.map((d) => { const span = (d.value / total) * Math.PI * 2; const s = { ...d, a0: a + gap / 2, a1: a + span - gap / 2 }; a += span; return s; });
  const focus = hover ?? selected;
  const fd = focus != null ? data[focus] : null;
  const key = data.map((d) => d.label).join('|');
  return (
    <div className="donut" style={{ width: size, height: size }} onMouseLeave={() => setHover(null)}>
      <svg width={size} height={size} role="img" aria-label="Gráfico de rosca">
        <circle cx={c} cy={c} r={r} className="donut-track" strokeWidth={thickness} />
        <g key={key}>
          {segs.map((s, i) => s.a1 > s.a0 && (
            <motion.path
              key={i}
              d={arc(c, c, r, s.a0, s.a1)}
              fill="none"
              stroke={`var(--s${(s.index ?? i) + 1})`}
              strokeLinecap="round"
              initial={{ pathLength: 0, strokeWidth: thickness }}
              animate={{ pathLength: 1, strokeWidth: focus === i ? thickness + 7 : thickness, opacity: focus != null && focus !== i ? 0.4 : 1 }}
              transition={{ pathLength: { duration: 0.9, ease, delay: 0.1 + i * 0.08 }, strokeWidth: spring, opacity: { duration: 0.2 } }}
              onMouseEnter={() => setHover(i)}
              onClick={() => onSelect?.(selected === i ? null : i)}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
            />
          ))}
        </g>
      </svg>
      <div className="donut-center">
        <AnimatePresence mode="wait">
          <motion.div key={fd ? fd.label : 'total'} initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }} transition={{ duration: 0.2 }}>
            <strong>{format(fd ? fd.value : total)}</strong>
            <span>{fd ? `${fd.label} · ${pct(fd.value / total)}` : centerLabel}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------- Anel de progresso ----------
export function Ring({ value, size = 150, thickness = 14, label, sub, tone = 's1' }) {
  const c = size / 2, r = c - thickness / 2 - 2;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={c} cy={c} r={r} className="donut-track" strokeWidth={thickness} />
        <motion.circle cx={c} cy={c} r={r} fill="none" stroke={`var(--${tone})`} strokeWidth={thickness} strokeLinecap="round" transform={`rotate(-90 ${c} ${c})`} initial={{ pathLength: 0 }} animate={{ pathLength: value }} transition={{ duration: 1.3, ease, delay: 0.15 }} />
      </svg>
      <div className="donut-center"><div><strong>{label}</strong><span>{sub}</span></div></div>
    </div>
  );
}

// ---------- Barras horizontais (ranking) ----------
export function HBars({ rows, format = brlK, max: maxProp, onSelect, compact = false }) {
  const max = maxProp || Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className={`hbars ${compact ? 'compact' : ''}`}>
      {rows.map((r, i) => (
        <motion.button type="button" key={r.key || r.label} className="hbar" title={r.title} onClick={() => onSelect?.(r)} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, ...softSpring }} disabled={!onSelect}>
          <div className="hbar-top">
            {r.lead}
            <span className="hbar-label">{r.label}</span>
            <span className="hbar-value">{format(r.value)}</span>
          </div>
          <div className="hbar-track">
            <motion.div className="hbar-fill" style={{ background: r.color || 'var(--s1)' }} initial={{ width: 0 }} animate={{ width: `${(r.value / max) * 100}%` }} transition={{ duration: 0.9, ease, delay: 0.1 + i * 0.05 }} />
          </div>
          {r.sub && !compact && <div className="hbar-sub">{r.sub}</div>}
        </motion.button>
      ))}
    </div>
  );
}

// ---------- Sparkline ----------
export function Sparkline({ values, width = 96, height = 30, tone }) {
  const max = Math.max(...values, 1), min = Math.min(...values, 0);
  const pts = values.map((v, i) => [2 + (i * (width - 4)) / Math.max(1, values.length - 1), 2 + (height - 4) * (1 - (v - min) / (max - min || 1))]);
  const up = values[values.length - 1] >= values[0];
  return (
    <svg width={width} height={height} className={`spark ${tone || (up ? 'up' : 'down')}`} aria-hidden="true">
      <motion.path d={monotone(pts)} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease }} />
    </svg>
  );
}
