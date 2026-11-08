import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, LayoutGroup, MotionConfig, animate, motion } from 'framer-motion';
import { ADMIN, CUSTOMERS, PRODUCTS, catById, periodRange, productStats } from './data.js';
import { Avatar, Icon, IconButton, Popover, ProductArt, ToastProvider, brl, brlK, ease, fmtTime, pct, softSpring, spring, stagger, useToast } from './ui.jsx';
import { StoreProvider, THEMES, go, useRoute, useStore } from './store.jsx';
import Overview from './pages/overview.jsx';
import Reports from './pages/reports.jsx';
import Products from './pages/products.jsx';
import Orders from './pages/orders.jsx';
import { Finance, Billing } from './pages/finance.jsx';
import { Tasks, Team, Roles, Clients, Support, Announcements } from './pages/people.jsx';
import Moderation from './pages/moderation.jsx';
import { Activity, Integrations, System, Settings } from './pages/system.jsx';

const NAV = [
  { section: 'Painel', items: [
    { id: 'visao-geral', label: 'Visão geral', icon: 'home', page: Overview },
    { id: 'relatorios', label: 'Relatórios', icon: 'reports', page: Reports },
    { id: 'tarefas', label: 'Tarefas', icon: 'tasks', page: Tasks },
  ] },
  { section: 'Pessoas', items: [
    { id: 'equipe', label: 'Equipe', icon: 'team', page: Team },
    { id: 'funcoes', label: 'Funções e acesso', icon: 'shield', page: Roles },
    { id: 'clientes', label: 'Clientes', icon: 'clients', page: Clients },
    { id: 'atendimento', label: 'Atendimento', icon: 'support', page: Support },
    { id: 'comunicados', label: 'Comunicados', icon: 'megaphone', page: Announcements },
  ] },
  { section: 'Negócio', items: [
    { id: 'produtos', label: 'Produtos', icon: 'box', page: Products },
    { id: 'pedidos', label: 'Pedidos', icon: 'cart', page: Orders },
    { id: 'moderacao', label: 'Moderação', icon: 'moderation', page: Moderation },
    { id: 'financeiro', label: 'Financeiro', icon: 'dollar', page: Finance },
    { id: 'cobranca', label: 'Cobrança', icon: 'receipt', page: Billing },
  ] },
  { section: 'Sistema', items: [
    { id: 'atividade', label: 'Log de atividades', icon: 'history', page: Activity },
    { id: 'integracoes', label: 'Integrações', icon: 'plug', page: Integrations },
    { id: 'sistema', label: 'Sistema', icon: 'server', page: System },
    { id: 'configuracoes', label: 'Configurações', icon: 'settings', page: Settings },
  ] },
];
const ALL = NAV.flatMap((s) => s.items);


// ---------- Fundo animado ----------
function Wallpaper() {
  return (
    <div className="wallpaper" aria-hidden="true">
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" /><div className="blob b4" />
      <div className="grain" />
    </div>
  );
}

// ---------- Sidebar ----------
function Sidebar({ active, open, onClose }) {
  const { badges } = useStore();
  return (
    <>
      <AnimatePresence>{open && <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />}</AnimatePresence>
      <motion.aside className={`sidebar glass-dark ${open ? 'open' : ''}`} initial={{ opacity: 0, filter: 'blur(10px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.7, ease }}>
        <div className="brand">
          <motion.span className="brand-mark" whileHover={{ rotate: -8, scale: 1.06 }} transition={spring}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l8 13 8-13 M8.5 6h7" /></svg>
          </motion.span>
          <div><strong>{ADMIN.store} Admin</strong><small>Central de controle</small></div>
        </div>
        <nav className="nav scroll scroll-dark" aria-label="Navegação principal">
          <LayoutGroup id="nav">
            {NAV.map((s, si) => (
              <div key={s.section} className="nav-section">
                <motion.div className="nav-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + si * 0.08 }}>{s.section}</motion.div>
                {s.items.map((it, ii) => {
                  const on = active === it.id;
                  const b = badges[it.id];
                  return (
                    <motion.a key={it.id} href={`#/${it.id}`} className={`nav-item ${on ? 'active' : ''}`} onClick={onClose}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + si * 0.08 + ii * 0.03, ...softSpring }}
                      whileTap={{ scale: 0.97 }} aria-current={on ? 'page' : undefined}>
                      {on && <motion.span layoutId="nav-pill" className="nav-pill" transition={spring} />}
                      <span className="nav-icon"><Icon name={it.icon} size={16} /></span>
                      <span className="nav-text">{it.label}</span>
                      <AnimatePresence>{b > 0 && <motion.span key={b} className="nav-badge" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={spring}>{b}</motion.span>}</AnimatePresence>
                    </motion.a>
                  );
                })}
              </div>
            ))}
          </LayoutGroup>
        </nav>
        <div className="plan">
          <div className="plan-row"><strong>Plano Business</strong><span>13 de 20 assentos</span></div>
          <div className="plan-track"><motion.i initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ duration: 1.4, ease, delay: 0.6 }} /></div>
        </div>
      </motion.aside>
    </>
  );
}

// ---------- Paleta de comandos (⌘K) ----------
function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const { orders } = useStore();
  const inputRef = useRef(null);
  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const results = useMemo(() => {
    const n = norm(q.trim());
    const pages = ALL.filter((p) => !n || norm(p.label).includes(n)).map((p) => ({ group: 'Páginas', key: 'pg' + p.id, icon: p.icon, label: p.label, hint: 'Ir para', run: () => go(p.id) }));
    if (!n) return pages.slice(0, 8);
    const prods = PRODUCTS.filter((p) => norm(p.name).includes(n) || norm(p.sku).includes(n)).slice(0, 6).map((p) => ({ group: 'Produtos', key: p.id, art: p, label: p.name, hint: brl(p.price), run: () => go('produtos', { p: p.id }) }));
    const ords = orders.filter((o) => o.id.includes(n) || norm(o.customer.name).includes(n)).slice(0, 4).map((o) => ({ group: 'Pedidos', key: o.id, icon: 'cart', label: `Pedido ${o.id} · ${o.customer.name}`, hint: brl(o.total), run: () => go('pedidos', { o: o.id.slice(1) }) }));
    const cust = CUSTOMERS.filter((c) => norm(c.name).includes(n) || norm(c.email).includes(n)).slice(0, 4).map((c) => ({ group: 'Clientes', key: c.id, icon: 'clients', label: c.name, hint: `${c.city} · ${c.uf}`, run: () => go('clientes', { q: c.name }) }));
    return [...pages, ...prods, ...ords, ...cust];
  }, [q, orders]);
  useEffect(() => setSel(0), [q]);
  const runAt = (i) => { const r = results[i]; if (r) { r.run(); onClose(); } };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    if (e.key === 'Enter') runAt(sel);
    if (e.key === 'Escape') onClose();
  };
  let lastGroup = null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="overlay overlay-top" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div className="palette" role="dialog" aria-label="Busca rápida" onMouseDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -20, scale: 0.96, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, scale: 0.98, filter: 'blur(6px)' }} transition={softSpring}>
            <div className="palette-input">
              <Icon name="search" size={18} />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Buscar páginas, produtos, pedidos, clientes…" aria-label="Buscar" />
              <kbd>esc</kbd>
            </div>
            <div className="palette-list scroll">
              {results.length === 0 && <div className="palette-empty">Nada encontrado para “{q}”.</div>}
              {results.map((r, i) => {
                const header = r.group !== lastGroup ? (lastGroup = r.group) : null;
                return (
                  <React.Fragment key={r.key}>
                    {header && <div className="palette-group">{header}</div>}
                    <button className={`palette-item ${i === sel ? 'sel' : ''}`} onMouseEnter={() => setSel(i)} onClick={() => runAt(i)}>
                      {r.art ? <ProductArt art={r.art.art} cat={r.art.cat} size={28} radius={8} /> : <span className="palette-icon"><Icon name={r.icon} size={15} /></span>}
                      <span className="palette-label">{r.label}</span>
                      <span className="palette-hint">{r.hint}</span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>↵</kbd> abrir</span><span><kbd>⌘</kbd><kbd>K</kbd> alternar</span></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- Topbar ----------
function Topbar({ onMenu, onSearch }) {
  const { theme, setTheme, readNotifs, setReadNotifs, badges } = useStore();
  const [pop, setPop] = useState(null);
  const refs = { theme: useRef(null), ai: useRef(null), bell: useRef(null), user: useRef(null) };
  const toggle = (k) => setPop((p) => (p === k ? null : k));
  const close = () => setPop(null);
  const toast = useToast();
  const insights = useMemo(() => {
    const r7 = productStats(periodRange('7d'));
    const big = r7.rows.filter((r) => r.prev > 0);
    const grow = [...big].sort((a, b) => b.delta - a.delta)[0];
    const fall = [...big].sort((a, b) => a.delta - b.delta)[0];
    const low = [...PRODUCTS].sort((a, b) => a.stock - b.stock)[0];
    const cats = {};
    r7.rows.forEach((r) => (cats[r.p.cat] = (cats[r.p.cat] || 0) + r.revenue));
    const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
    return [
      { icon: 'trend', tone: 'green', title: `${grow.p.name} cresceu ${pct(grow.delta)}`, text: `Faturou ${brlK(grow.revenue)} nos últimos 7 dias. Considere reforçar estoque e mídia.`, to: ['produtos', { p: grow.p.id }] },
      { icon: 'down', tone: 'red', title: `${fall.p.name} caiu ${pct(Math.abs(fall.delta))}`, text: 'Queda vs. 7 dias anteriores. Verifique preço frente aos concorrentes.', to: ['produtos', { p: fall.p.id }] },
      { icon: 'package', tone: 'amber', title: `Estoque baixo: ${low.name}`, text: `Restam ${low.stock} unidades em estoque. Programe a reposição com Compras.`, to: ['produtos', { p: low.id }] },
      { icon: 'star', tone: 'blue', title: `${catById[topCat[0]].name} lidera a semana`, text: `${brlK(topCat[1])} em 7 dias, ${pct(topCat[1] / r7.total)} do faturamento.`, to: ['relatorios'] },
    ];
  }, []);
  const notifs = [
    { icon: 'cart', title: `${badges.pedidos} pedidos pagos aguardando separação`, time: 'agora', to: 'pedidos' },
    { icon: 'moderation', title: `${badges.moderacao} anúncios de sellers para revisar`, time: 'há 12 min', to: 'moderacao' },
    { icon: 'alert', title: 'Cálculo de frete com latência alta', time: 'há 38 min', to: 'sistema' },
    { icon: 'dollar', title: 'Repasse da Eletro Sul venceu ontem', time: 'há 2 h', to: 'financeiro' },
    { icon: 'support', title: `${badges.atendimento} tickets abertos no atendimento`, time: 'há 3 h', to: 'atendimento' },
  ];
  return (
    <motion.header className="topbar glass-dark" initial={{ opacity: 0, y: -16, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.7, ease, delay: 0.08 }}>
      <IconButton icon="menu" label="Abrir menu" className="menu-btn" onClick={onMenu} />
      <motion.button className="search-trigger" onClick={onSearch} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Icon name="search" size={15} />
        <span>Buscar produtos, pedidos, clientes…</span>
        <kbd>⌘K</kbd>
      </motion.button>
      <div className="top-actions">
        <span ref={refs.theme}><IconButton icon="palette" label="Aparência" className="top-btn" onClick={() => toggle('theme')} /></span>
        <span ref={refs.ai}>
          <motion.button className="orb" aria-label="Insights" title="Insights" onClick={() => toggle('ai')} whileHover={{ scale: 1.1, rotate: 30 }} whileTap={{ scale: 0.9 }} transition={spring}>
            <Icon name="sparkles" size={15} />
          </motion.button>
        </span>
        <span ref={refs.bell}>
          <IconButton icon="bell" label="Notificações" className="top-btn bell" onClick={() => toggle('bell')}>
            <AnimatePresence>{!readNotifs && <motion.i className="bell-dot" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} />}</AnimatePresence>
          </IconButton>
        </span>
        <motion.button ref={refs.user} className="user-chip" onClick={() => toggle('user')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Avatar name={ADMIN.name} size={34} tone="me" />
          <span className="user-meta"><strong>{ADMIN.name}</strong><small>{ADMIN.role}</small></span>
          <Icon name="chevronDown" size={14} />
        </motion.button>
      </div>

      <Popover open={pop === 'theme'} onClose={close} anchor={refs.theme} width={300}>
        <div className="pop-head"><strong>Aparência</strong><span>Papel de parede e contraste</span></div>
        <div className="theme-grid">
          {THEMES.map((t) => (
            <button key={t.id} className={`theme-opt ${theme === t.id ? 'on' : ''}`} onClick={() => setTheme(t.id)}>
              <span className="theme-sw" style={{ background: t.sw }}>{theme === t.id && <motion.span className="theme-check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={spring}><Icon name="check" size={12} stroke={3} /></motion.span>}</span>
              {t.name}
            </button>
          ))}
        </div>
      </Popover>

      <Popover open={pop === 'ai'} onClose={close} anchor={refs.ai} width={380}>
        <div className="pop-head"><strong><Icon name="sparkles" size={14} /> Insights da semana</strong><span>Gerados a partir das vendas dos últimos 7 dias</span></div>
        <motion.div className="pop-list" variants={stagger} initial="hidden" animate="show">
          {insights.map((it, i) => (
            <motion.button key={i} className="insight" variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} onClick={() => { go(...it.to); close(); }}>
              <span className={`insight-icon tone-soft-${it.tone}`}><Icon name={it.icon} size={14} /></span>
              <span><strong>{it.title}</strong><small>{it.text}</small></span>
            </motion.button>
          ))}
        </motion.div>
      </Popover>

      <Popover open={pop === 'bell'} onClose={close} anchor={refs.bell} width={360}>
        <div className="pop-head row"><div><strong>Notificações</strong><span>{readNotifs ? 'Tudo lido' : `${notifs.length} novas`}</span></div><button className="link" onClick={() => setReadNotifs(true)}>Marcar como lidas</button></div>
        <motion.div className="pop-list" variants={stagger} initial="hidden" animate="show">
          {notifs.map((n, i) => (
            <motion.button key={i} className={`notif ${readNotifs ? 'read' : ''}`} variants={{ hidden: { opacity: 0, x: 10 }, show: { opacity: 1, x: 0 } }} onClick={() => { go(n.to); close(); }}>
              <span className="notif-icon"><Icon name={n.icon} size={14} /></span>
              <span className="notif-text">{n.title}<small>{n.time}</small></span>
              {!readNotifs && <i className="unread" />}
            </motion.button>
          ))}
        </motion.div>
      </Popover>

      <Popover open={pop === 'user'} onClose={close} anchor={refs.user} width={240}>
        <div className="pop-head"><strong>{ADMIN.name}</strong><span>erick@{ADMIN.store.toLowerCase()}.com.br</span></div>
        <div className="menu-list">
          <button onClick={() => { go('configuracoes'); close(); }}><Icon name="settings" size={15} />Configurações</button>
          <button onClick={() => { go('funcoes'); close(); }}><Icon name="shield" size={15} />Funções e acesso</button>
          <button onClick={() => { go('cobranca'); close(); }}><Icon name="receipt" size={15} />Plano e cobrança</button>
          <button className="danger" onClick={() => { toast('Sessão encerrada (demonstração)', { tone: 'gray', icon: 'logout' }); close(); }}><Icon name="logout" size={15} />Sair</button>
        </div>
      </Popover>
    </motion.header>
  );
}

// ---------- App ----------
function Shell() {
  const route = useRoute();
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const item = ALL.find((i) => i.id === route.path) || ALL[0];
  // Página exibida: troca só depois que a atual termina de desfocar/sumir
  const [shown, setShown] = useState({ item, params: route.params });
  const pageRef = useRef(null);
  const paramsKey = JSON.stringify(route.params);

  useEffect(() => {
    if (item.id === shown.item.id) { setShown({ item, params: route.params }); return; }
    const el = pageRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el || reduce) { setShown({ item, params: route.params }); return; }
    let done = false;
    const swap = () => { if (!done) { done = true; setShown({ item, params: route.params }); } };
    const ctrl = animate(el, { opacity: 0, filter: 'blur(14px)', y: -6 }, { duration: 0.2, ease: 'easeIn' });
    ctrl.then(swap);
    const t = setTimeout(swap, 320); // garantia caso o navegador não conclua a animação
    return () => { done = true; clearTimeout(t); ctrl.stop(); };
  }, [item.id, paramsKey]);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); }
      else if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName)) { e.preventDefault(); setPalette(true); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  useEffect(() => { document.title = `${shown.item.label} · ${ADMIN.store} Admin`; window.scrollTo({ top: 0, behavior: 'auto' }); }, [shown.item.id]);

  const Page = shown.item.page;
  return (
    <>
      <Wallpaper />
      <div className="app">
        <Sidebar active={item.id} open={menu} onClose={() => setMenu(false)} />
        <div className="main">
          <Topbar onMenu={() => setMenu(true)} onSearch={() => setPalette(true)} />
          <motion.main className="sheet" initial={{ opacity: 0, y: 24, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, ease, delay: 0.12 }}>
            <motion.div key={shown.item.id} ref={pageRef} className="page"
              initial={{ opacity: 0, filter: 'blur(16px)', y: 14 }} animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ duration: 0.45, ease }}>
              <motion.div variants={stagger} initial="hidden" animate="show">
                <Page params={shown.params} />
              </motion.div>
            </motion.div>
          </motion.main>
          <footer className="foot">Dados demonstrativos · atualizado às {fmtTime(new Date())}</footer>
        </div>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <MotionConfig reducedMotion="user">
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  </MotionConfig>,
);
