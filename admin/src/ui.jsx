import React, { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion';
import { catById, initials } from './data.js';

// ---------- Formatação ----------
const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brl0Fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const compactFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 });
const intFmt = new Intl.NumberFormat('pt-BR');
export const brl = (v) => brlFmt.format(v || 0);
export const brl0 = (v) => brl0Fmt.format(v || 0);
export const brlK = (v) => compactFmt.format(v || 0).replace(/ /g, ' ');
export const int = (v) => intFmt.format(Math.round(v || 0));
export const pct = (v, d = 1) => `${(v * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })}%`;
export const ago = (mins) => mins < 60 ? `há ${Math.max(1, Math.round(mins))} min` : mins < 1440 ? `há ${Math.round(mins / 60)} h` : `há ${Math.round(mins / 1440)} d`;
export const fmtDate = (d, o = { day: '2-digit', month: 'short' }) => d.toLocaleDateString('pt-BR', o).replace('.', '');
export const fmtTime = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// ---------- Movimento ----------
export const ease = [0.16, 1, 0.3, 1];
// O desfoque usa curva sem overshoot (mola poderia gerar blur negativo)
const blurT = { filter: { type: 'tween', duration: 0.4, ease } };
export const spring = { type: 'spring', stiffness: 380, damping: 32, mass: 0.8, ...blurT };
export const softSpring = { type: 'spring', stiffness: 220, damping: 28, ...blurT };
export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } } };
export const rise = {
  hidden: { opacity: 0, y: 18, scale: 0.985, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.6, ease } },
};

// ---------- Ícones (traço 1.75, estilo SF Symbols / Lucide) ----------
const P = {
  home: 'M3 10.5 12 3l9 7.5 M5 9v11h5v-6h4v6h5V9',
  reports: 'M4 20V10 M10 20V4 M16 20v-7 M22 20H2',
  tasks: 'M9 11l3 3 8-8 M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9',
  team: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
  clients: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M7 18a5 5 0 0 1 10 0',
  support: 'M3 14v-2a9 9 0 0 1 18 0v2 M21 14v3a2 2 0 0 1-2 2h-1v-6h3 M3 14v3a2 2 0 0 0 2 2h1v-6H3 M18 19a4 4 0 0 1-4 3h-2',
  megaphone: 'M3 11v2a1 1 0 0 0 1 1h3l6 5V5L7 10H4a1 1 0 0 0-1 1z M17 8a5 5 0 0 1 0 8 M20 5a9 9 0 0 1 0 14',
  box: 'M21 8 12 3 3 8v8l9 5 9-5z M3 8l9 5 9-5 M12 13v8',
  cart: 'M3 3h2l2.4 12.2a2 2 0 0 0 2 1.8h8.7a2 2 0 0 0 2-1.6L21.5 8H6 M9 21h.01 M18 21h.01',
  moderation: 'M9 3h6a1 1 0 0 1 1 1v2H8V4a1 1 0 0 1 1-1z M16 5h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2 M9 14l2 2 4-4',
  dollar: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M15 8.5c-.5-1-1.6-1.5-3-1.5-1.9 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.2 2.2-3 2.2-1.5 0-2.6-.6-3.1-1.6 M12 5.5V7 M12 17v1.5',
  receipt: 'M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2z M9 7h6 M9 11h6 M9 15h4',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8 M3 3v5h5 M12 7v5l3 2',
  plug: 'M9 2v6 M15 2v6 M6 8h12v4a6 6 0 0 1-12 0z M12 18v4',
  server: 'M3 4h18v7H3z M3 13h18v7H3z M7 7.5h.01 M7 16.5h.01 M11 7.5h6 M11 16.5h6',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M21 21l-4.35-4.35',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0',
  palette: 'M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A4.6 4.6 0 0 0 22 10.8C22 5.9 17.5 2 12 2 M6.5 11.5h.01 M9.5 7.5h.01 M14.5 7.5h.01 M17.5 11.5h.01',
  sparkles: 'M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z M19 3v4 M17 5h4 M5 17v4 M3 19h4',
  plus: 'M12 5v14 M5 12h14',
  download: 'M12 3v12 M7 10l5 5 5-5 M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  x: 'M18 6 6 18 M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  chevronRight: 'M9 18l6-6-6-6',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronDown: 'M6 9l6 6 6-6',
  up: 'M7 17 17 7 M8 7h9v9',
  down: 'M7 7l10 10 M17 8v9H8',
  trend: 'M3 17l6-6 4 4 8-8 M15 7h6v6',
  truck: 'M1 4h14v12H1z M15 9h4l3 3v4h-7 M5.5 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M18.5 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4',
  card: 'M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z M2 10h20 M6 15h4',
  pix: 'M12 2.5 21.5 12 12 21.5 2.5 12z M8 12l4-4 4 4-4 4z',
  barcode: 'M3 5v14 M7 5v14 M10 5v14 M14 5v14 M17 5v14 M21 5v14',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5',
  tag: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z M7.5 7.5h.01',
  store: 'M3 9l1.5-5h15L21 9 M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0 M5 12v9h14v-9 M10 21v-5h4v5',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z',
  send: 'M22 2 11 13 M22 2l-7 20-4-9-9-4z',
  pin: 'M12 17v5 M9 10.8V4h6v6.8l3 3.2v2H6v-2z',
  trash: 'M3 6h18 M8 6V4h8v2 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6 M10 11v6 M14 11v6',
  more: 'M12 12h.01 M19 12h.01 M5 12h.01',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  calendar: 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M3 10h18 M8 2v4 M16 2v4',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  mail: 'M3 5h18v14H3z M3 6l9 7 9-7',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
  mapPin: 'M12 22s7-6.1 7-12a7 7 0 0 0-14 0c0 5.9 7 12 7 12z M12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5',
  image: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M8.5 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3 M21 15l-5-5L5 21',
  refresh: 'M21 12a9 9 0 0 1-15.5 6.3L3 16 M3 12a9 9 0 0 1 15.5-6.3L21 8 M21 3v5h-5 M3 21v-5h5',
  lock: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
  zap: 'M13 2 3 14h9l-1 8 10-12h-9z',
  alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z M12 9v4 M12 17h.01',
  checkCircle: 'M22 11.1V12a10 10 0 1 1-5.9-9.1 M22 4 12 14l-3-3',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M12 16v-4 M12 8h.01',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M2 12h20 M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z',
  command: 'M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3',
  chart: 'M3 3v18h18 M7 14l4-4 4 4 5-6',
  sliders: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6',
  wallet: 'M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3 M21 11h-5a2 2 0 0 0 0 4h5z',
  package: 'M16.5 9.4 7.5 4.2 M21 16V8l-9-5-9 5v8l9 5z M3.3 7 12 12l8.7-5 M12 22V12',
  percent: 'M19 5 5 19 M6.5 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5 M17.5 15a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  undo: 'M3 7v6h6 M21 17a9 9 0 0 0-15-6.7L3 13',
  arrowRight: 'M5 12h14 M12 5l7 7-7 7',
  grip: 'M9 5h.01 M9 12h.01 M9 19h.01 M15 5h.01 M15 12h.01 M15 19h.01',
};
export function Icon({ name, size = 16, stroke = 1.75, className, style }) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] || P.box} />
    </svg>
  );
}

// ---------- Arte de produto (ilustrações vetoriais) ----------
const ART = {
  gpu: 'M6 16a2 2 0 0 1 2-2h32a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z M18 17a6 6 0 1 0 0 12 6 6 0 0 0 0-12 M32 17a6 6 0 1 0 0 12 6 6 0 0 0 0-12 M18 21a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M32 21a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M14 32v3h20v-3',
  cpu: 'M14 14h20v20H14z M19 19h10v10H19z M18 8v6 M24 8v6 M30 8v6 M18 34v6 M24 34v6 M30 34v6 M8 18h6 M8 24h6 M8 30h6 M34 18h6 M34 24h6 M34 30h6',
  ssd: 'M6 17a2 2 0 0 1 2-2h32a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z M11 21h14v6H11z M30 21h2 M35 21h2 M30 27h7',
  ram: 'M5 16h38v14H5z M9 20h5v6H9z M17 20h5v6h-5z M26 20h5v6h-5z M34 20h5v6h-5z M9 30v3 M14 30v3 M19 30v3 M29 30v3 M34 30v3 M39 30v3',
  psu: 'M8 12h32v24H8z M24 16a8 8 0 1 0 0 16 8 8 0 0 0 0-16 M24 20v8 M20 24h8 M12 15h3',
  board: 'M8 8h32v32H8z M14 14h10v10H14z M28 14h6v4h-6z M28 22h6 M28 26h6 M14 30h20 M14 34h20',
  cooler: 'M10 10h28v28H10z M24 14a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M24 24l-6-6 M24 24l6-6 M24 24l6 6 M24 24l-6 6',
  phone: 'M17 5h14a3 3 0 0 1 3 3v32a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z M21 9h6 M22 39h4',
  watch: 'M17 14h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3z M18 14l2-8h8l2 8 M18 34l2 8h8l2-8 M24 20v4l3 2',
  tv: 'M6 10a2 2 0 0 1 2-2h32a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z M17 41h14 M24 34v7',
  projector: 'M6 18h36v14H6z M32 20a5 5 0 1 0 0 10 5 5 0 0 0 0-10 M11 22h10 M11 26h6 M10 32v3 M38 32v3',
  fridge: 'M14 4h20a2 2 0 0 1 2 2v36a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M12 18h24 M17 9v5 M17 23v8',
  washer: 'M10 6h28v36H10z M10 13h28 M24 18a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M14 9.5h4 M32 9.5h.01 M19 28c2-2 4 2 6 0s3-1 4 0',
  microwave: 'M5 12h38v24H5z M9 16h24v16H9z M37 17v2 M37 23v2 M37 29v2',
  airfryer: 'M14 8h20l3 30a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2z M13 22h22 M20 30h8 M20 14h8',
  ac: 'M4 12h40v14H4z M8 22h32 M14 32l-2 6 M24 32v6 M34 32l2 6 M36 16h3',
  robot: 'M24 8a16 16 0 1 0 0 32 16 16 0 0 0 0-32 M24 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M14 30h20',
  coffee: 'M12 6h24v8H12z M14 14h20v24H14z M20 24h8v8h-8z M18 42h12 M17 10h3',
  console: 'M12 8h10v32H12z M26 8h10v32H26z M17 14h.01 M31 34h2',
  gamepad: 'M14 16h20a8 8 0 0 1 8 8v4a6 6 0 0 1-10.5 4L28 28h-8l-3.5 4A6 6 0 0 1 6 28v-4a8 8 0 0 1 8-8z M14 21v6 M11 24h6 M31 22h.01 M35 26h.01',
  chair: 'M16 6h16a2 2 0 0 1 2 2v16H14V8a2 2 0 0 1 2-2z M12 24h24v5H12z M24 29v7 M16 42l8-6 8 6 M10 18v8 M38 18v8',
  disc: 'M24 6a18 18 0 1 0 0 36 18 18 0 0 0 0-36 M24 19a5 5 0 1 0 0 10 5 5 0 0 0 0-10 M15 15a12 12 0 0 1 6-4',
  headset: 'M10 28v-4a14 14 0 0 1 28 0v4 M10 26h6v12h-4a2 2 0 0 1-2-2z M38 26h-6v12h4a2 2 0 0 0 2-2z M16 38c0 3 3 4 7 4',
  laptop: 'M10 10h28a2 2 0 0 1 2 2v20H8V12a2 2 0 0 1 2-2z M4 32h40l-2 5H6z M21 35h6',
  buds: 'M16 10a6 6 0 0 1 6 6v6a6 6 0 0 1-12 0v-6a6 6 0 0 1 6-6z M16 28v10 M32 10a6 6 0 0 1 6 6v6a6 6 0 0 1-12 0v-6a6 6 0 0 1 6-6z M32 28v10',
  soundbar: 'M4 20h40v10H4z M10 25h.01 M16 25h.01 M22 25h4 M32 25h.01 M38 25h.01 M10 34h28',
  speaker: 'M14 6h20a3 3 0 0 1 3 3v30a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z M24 22a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M24 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  headphone: 'M8 30v-6a16 16 0 0 1 32 0v6 M8 28h7v12H10a2 2 0 0 1-2-2z M40 28h-7v12h5a2 2 0 0 0 2-2z',
  sofa: 'M10 20v-6a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v6 M6 22a3 3 0 0 1 6 0v4h24v-4a3 3 0 0 1 6 0v12H6z M10 34v4 M38 34v4',
  bed: 'M6 38V12 M42 38V26a4 4 0 0 0-4-4H6 M6 32h36 M11 22v-5h11v5',
  desk: 'M4 16h40v4H4z M8 20v20 M40 20v20 M28 20v12h12 M30 26h4',
  officechair: 'M16 4h16a2 2 0 0 1 2 2v14H14V6a2 2 0 0 1 2-2z M12 24h24 M24 24v10 M14 42l10-8 10 8 M24 34v8',
  wardrobe: 'M8 4h32v38H8z M24 4v38 M20 20v6 M28 20v6 M8 42v3 M40 42v3',
};
export function ProductArt({ art, cat, size = 44, radius = 12, className = '' }) {
  const i = catById[cat]?.index ?? 0;
  return (
    <span className={`art art-${i} ${className}`} style={{ width: size, height: size, borderRadius: radius }}>
      <svg viewBox="0 0 48 48" width={size * 0.62} height={size * 0.62} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={ART[art] || ART.gpu} />
      </svg>
    </span>
  );
}

// ---------- Primitivos ----------
export function Card({ className = '', children, hover = false, as = 'section', ...rest }) {
  const M = motion[as];
  return (
    <M variants={rise} className={`card ${className}`} whileHover={hover ? { y: -3, transition: spring } : undefined} {...rest}>
      {children}
    </M>
  );
}
export const Grid = ({ className = '', children, ...rest }) => <motion.div variants={stagger} className={className} {...rest}>{children}</motion.div>;

export function Button({ children, icon, variant = 'glass', size, className = '', ...rest }) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      className={`btn btn-${variant} ${size ? 'btn-' + size : ''} ${className}`}
      whileHover={reduced ? undefined : { y: -1.5, scale: 1.02 }}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      transition={spring}
      {...rest}
    >
      {icon && <Icon name={icon} size={15} />}
      {children}
    </motion.button>
  );
}
export function IconButton({ icon, label, className = '', children, ...rest }) {
  return (
    <motion.button type="button" aria-label={label} title={label} className={`icon-btn ${className}`} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }} transition={spring} {...rest}>
      <Icon name={icon} size={16} />
      {children}
    </motion.button>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <motion.header className="page-head" variants={rise}>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </motion.header>
  );
}

export function CardHead({ title, subtitle, children }) {
  return (
    <div className="card-head">
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="card-actions">{children}</div>}
    </div>
  );
}

// Controle segmentado com "pílula" deslizante (layoutId)
export function Segmented({ options, value, onChange, className = '', size, dark = false }) {
  const id = useId();
  return (
    <div className={`segmented ${dark ? 'segmented-dark' : ''} ${size ? 'seg-' + size : ''} ${className}`} role="tablist">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button key={o.id} role="tab" aria-selected={active} className={active ? 'active' : ''} onClick={() => onChange(o.id)}>
            {active && <motion.span layoutId={`seg-${id}`} className="seg-pill" transition={spring} />}
            <span className="seg-label">{o.label}{o.count != null && <em className="seg-count">{o.count}</em>}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Badge({ tone = 'gray', children, icon, dot }) {
  return (
    <span className={`badge tone-${tone}`}>
      {dot && <i className="badge-dot" />}
      {icon && <Icon name={icon} size={12} stroke={2.2} />}
      {children}
    </span>
  );
}

export function Delta({ value, inverse = false, compact = false }) {
  if (!isFinite(value)) return null;
  const good = inverse ? value < 0 : value >= 0;
  return (
    <span className={`delta ${good ? 'good' : 'bad'} ${compact ? 'compact' : ''}`} title="Comparado ao período anterior de mesma duração">
      <Icon name={value >= 0 ? 'up' : 'down'} size={11} stroke={2.4} />
      {pct(Math.abs(value))}
    </span>
  );
}

export function Avatar({ name, size = 32, status, tone }) {
  const hue = [...name].reduce((s, c) => s + c.charCodeAt(0), 0) % 6;
  return (
    <span className={`avatar av-${tone ?? hue}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials(name)}
      {status && <i className={`presence ${status}`} />}
    </span>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <motion.span className="knob" layout transition={spring} />
    </button>
  );
}

export function Progress({ value, tone = 'blue', height = 6, delay = 0 }) {
  return (
    <div className="progress" style={{ height }}>
      <motion.div className={`progress-fill tone-fill-${tone}`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, value * 100)}%` }} transition={{ duration: 1, ease, delay }} />
    </div>
  );
}

// Número que conta do valor anterior até o novo
export function Num({ value, format = int, duration = 1.1 }) {
  const ref = useRef(null);
  const prev = useRef(0);
  const reduced = useReducedMotion();
  useLayoutEffect(() => {
    if (reduced) { if (ref.current) ref.current.textContent = format(value); prev.current = value; return; }
    const from = prev.current;
    prev.current = value;
    const c = animate(from, value, { duration, ease, onUpdate: (v) => { if (ref.current) ref.current.textContent = format(v); } });
    return () => c.stop();
  }, [value]);
  return <span ref={ref} className="num">{format(prev.current)}</span>;
}

export function Stat({ icon, label, value, format = int, sub, delta, inverse, tone = 'blue', onClick, children }) {
  return (
    <Card className={`stat ${onClick ? 'clickable' : ''}`} hover onClick={onClick}>
      <div className="stat-top">
        <span className={`stat-icon tone-soft-${tone}`}><Icon name={icon} size={16} /></span>
        {delta != null && <Delta value={delta} inverse={inverse} />}
      </div>
      <div className="stat-value"><Num value={value} format={format} /></div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {children}
    </Card>
  );
}

export function Empty({ icon = 'search', title, text }) {
  return (
    <motion.div className="empty" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
      <span className="empty-icon"><Icon name={icon} size={22} /></span>
      <strong>{title}</strong>
      {text && <p>{text}</p>}
    </motion.div>
  );
}

export function SearchField({ value, onChange, placeholder = 'Buscar…', className = '' }) {
  return (
    <label className={`search-field ${className}`}>
      <Icon name="search" size={15} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <AnimatePresence>
        {value && (
          <motion.button type="button" aria-label="Limpar" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => onChange('')}>
            <Icon name="x" size={13} />
          </motion.button>
        )}
      </AnimatePresence>
    </label>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <IconButton icon="chevronLeft" label="Página anterior" disabled={page === 0} onClick={() => onChange(page - 1)} />
      <span>Página <b>{page + 1}</b> de {pages}</span>
      <IconButton icon="chevronRight" label="Próxima página" disabled={page >= pages - 1} onClick={() => onChange(page + 1)} />
    </div>
  );
}

// ---------- Sobreposições ----------
function useLockScroll(open) {
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = prev; };
  }, [open]);
}
function useEsc(open, onClose) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, subtitle, children, footer, width = 520 }) {
  useLockScroll(open);
  useEsc(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            className="modal" style={{ maxWidth: width }}
            initial={{ opacity: 0, y: 30, scale: 0.94, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 16, scale: 0.97, filter: 'blur(6px)' }}
            transition={softSpring}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>
              <IconButton icon="x" label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body scroll">{children}</div>
            {footer && <div className="modal-foot">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, subtitle, children, width = 560, header }) {
  useLockScroll(open);
  useEsc(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="overlay overlay-drawer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.aside
            role="dialog" aria-modal="true" aria-label={title}
            className="drawer" style={{ maxWidth: width }}
            initial={{ x: '104%', opacity: 0.6 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '104%', opacity: 0.6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="drawer-head">
              {header || <div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>}
              <IconButton icon="x" label="Fechar" onClick={onClose} />
            </div>
            <motion.div className="drawer-body scroll" variants={stagger} initial="hidden" animate="show">{children}</motion.div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// Popover ancorado em um botão (posição calculada a partir do retângulo do gatilho)
export function Popover({ open, onClose, anchor, children, width = 340, align = 'right', className = '' }) {
  const ref = useRef(null);
  useEsc(open, onClose);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target) && !anchor?.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, onClose, anchor]);
  const r = anchor?.current?.getBoundingClientRect();
  const style = r ? { top: r.bottom + 10, width: Math.min(width, window.innerWidth - 24), ...(align === 'right' ? { right: Math.max(12, window.innerWidth - r.right) } : { left: Math.max(12, r.left) }) } : {};
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div ref={ref} className={`popover ${className}`} style={style}
          initial={{ opacity: 0, y: -8, scale: 0.96, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -6, scale: 0.97, filter: 'blur(4px)' }}
          transition={softSpring}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ---------- Toasts ----------
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l.slice(-3), { id, text, tone: opts.tone || 'green', icon: opts.icon || 'checkCircle', action: opts.action }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), opts.duration || 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      {createPortal(
        <div className="toasts" aria-live="polite">
          <AnimatePresence initial={false}>
            {items.map((t) => (
              <motion.div key={t.id} layout className={`toast tone-${t.tone}`}
                initial={{ opacity: 0, y: 24, scale: 0.9, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, x: 60, scale: 0.95 }} transition={softSpring}>
                <Icon name={t.icon} size={16} />
                <span>{t.text}</span>
                {t.action && <button onClick={() => { t.action.run(); setItems((l) => l.filter((x) => x.id !== t.id)); }}>{t.action.label}</button>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}

// Medida responsiva de largura para os gráficos SVG
export function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    setW(ref.current.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

// Exporta linhas como CSV (separador ; para abrir direto no Excel em pt-BR)
export function downloadCSV(filename, header, rows) {
  const esc = (v) => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = '﻿' + [header, ...rows].map((r) => r.map(esc).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
