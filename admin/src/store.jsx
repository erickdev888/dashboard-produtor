import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ANNOUNCEMENTS, INTEGRATIONS, LISTINGS, ORDERS, PAYOUTS, TASKS, TICKETS } from './data.js';

// ---------- Roteamento por hash (funciona em GitHub Pages sem configuração) ----------
export function parseHash() {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [path, q] = h.split('?');
  return { path: path || 'visao-geral', params: Object.fromEntries(new URLSearchParams(q || '')) };
}
export const go = (path, params) => {
  const q = params ? '?' + new URLSearchParams(params).toString() : '';
  window.location.hash = '/' + path + q;
};
export function useRoute() {
  const [r, setR] = useState(parseHash);
  useEffect(() => {
    const h = () => setR(parseHash());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  return r;
}

export const THEMES = [
  { id: 'oceano', name: 'Oceano', sw: 'linear-gradient(135deg,#0b3d53,#1f7fa6 55%,#3b6fc4)' },
  { id: 'aurora', name: 'Aurora', sw: 'linear-gradient(135deg,#2a1e5c,#5b3fa8 50%,#1aa39a)' },
  { id: 'nevoa', name: 'Névoa', sw: 'linear-gradient(135deg,#dfe9f3,#b9d3ea 55%,#e9e4f5)' },
  { id: 'grafite', name: 'Grafite', sw: 'linear-gradient(135deg,#0d0f14,#1c222c 55%,#2a3340)' },
];

// ---------- Estado compartilhado entre páginas (badges do menu refletem ações) ----------
const StoreCtx = createContext(null);
export const useStore = () => useContext(StoreCtx);

const load = (k, d) => { try { const v = localStorage.getItem('vitrine-admin:' + k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem('vitrine-admin:' + k, JSON.stringify(v)); } catch { /* armazenamento indisponível */ } };

export function StoreProvider({ children }) {
  const [listings, setListings] = useState(() => LISTINGS.map((l) => ({ ...l, state: 'review' })));
  const [tasks, setTasks] = useState(TASKS);
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS);
  const [payouts, setPayouts] = useState(PAYOUTS);
  const [tickets, setTickets] = useState(TICKETS);
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [orders, setOrders] = useState(ORDERS);
  const [theme, setThemeState] = useState(() => load('theme', 'oceano'));
  const [readNotifs, setReadNotifs] = useState(false);

  useEffect(() => { document.documentElement.dataset.theme = theme; save('theme', theme); }, [theme]);

  const value = useMemo(() => ({
    listings, setListings, tasks, setTasks, announcements, setAnnouncements, payouts, setPayouts,
    tickets, setTickets, integrations, setIntegrations, orders, setOrders,
    theme, setTheme: setThemeState, readNotifs, setReadNotifs,
    badges: {
      tarefas: tasks.filter((t) => !t.done).length,
      atendimento: tickets.filter((t) => t.status === 'aberto').length,
      moderacao: listings.filter((l) => l.state === 'review').length,
      financeiro: payouts.filter((p) => p.status !== 'pago').length,
      pedidos: orders.filter((o) => o.status === 'pago').length,
    },
  }), [listings, tasks, announcements, payouts, tickets, integrations, orders, theme, readNotifs]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
