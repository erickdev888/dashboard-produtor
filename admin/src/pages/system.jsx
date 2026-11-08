import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ACTIVITY, ADMIN, LATENCY, SERVICES } from '../data.js';
import { Avatar, Badge, Button, Card, CardHead, Empty, Grid, Icon, PageHeader, SearchField, Segmented, Stat, Toggle, ago, int, rise, spring, useToast } from '../ui.jsx';
import { AreaChart } from '../charts.jsx';
import { THEMES, useStore } from '../store.jsx';

// ---------- Log de atividades ----------
const KIND = {
  price: ['tag', 'amber', 'Preços'], system: ['server', 'gray', 'Sistema'], product: ['box', 'blue', 'Catálogo'], moderation: ['moderation', 'violet', 'Moderação'],
  finance: ['dollar', 'green', 'Financeiro'], refund: ['undo', 'red', 'Reembolsos'], team: ['team', 'blue', 'Equipe'], order: ['truck', 'violet', 'Pedidos'],
};
export function Activity() {
  const [kind, setKind] = useState('todos');
  const [q, setQ] = useState('');
  const list = ACTIVITY.filter((a) => (kind === 'todos' || a.kind === kind) && (!q || `${a.who} ${a.action} ${a.target} ${a.detail}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <PageHeader title="Log de atividades" subtitle="Tudo o que foi alterado na loja, por quem e quando. Mantido por 365 dias.">
        <SearchField value={q} onChange={setQ} placeholder="Buscar no log" />
      </PageHeader>
      <motion.div variants={rise} className="chips" style={{ marginBottom: 16 }}>
        <button className={`chip ${kind === 'todos' ? 'on' : ''}`} onClick={() => setKind('todos')}>Tudo</button>
        {Object.entries(KIND).map(([k, [icon, , label]]) => <button key={k} className={`chip ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}><Icon name={icon} size={13} />{label}</button>)}
      </motion.div>
      <motion.div variants={rise} className="card">
        <div className="timeline">
          <AnimatePresence mode="popLayout" initial={false}>
            {list.map((a, i) => (
              <motion.div key={a.id} layout className="tl-item" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ ...spring, delay: i * 0.035 }}>
                <span className={`tl-icon tone-soft-${KIND[a.kind][1]}`}><Icon name={KIND[a.kind][0]} size={15} /></span>
                <div className="tl-body">
                  <b>{a.who}</b> {a.action} <b>{a.target}</b>
                  <small>{a.detail} · {ago(a.mins)}</small>
                </div>
                {a.who !== 'Sistema' ? <Avatar name={a.who} size={26} /> : <Badge tone="gray">auto</Badge>}
              </motion.div>
            ))}
          </AnimatePresence>
          {!list.length && <Empty icon="history" title="Nada encontrado no log" />}
        </div>
      </motion.div>
    </>
  );
}

// ---------- Integrações ----------
export function Integrations() {
  const { integrations, setIntegrations } = useStore();
  const [group, setGroup] = useState('Todas');
  const toast = useToast();
  const groups = ['Todas', ...new Set(integrations.map((i) => i.group))];
  const list = integrations.filter((i) => group === 'Todas' || i.group === group);
  const flip = (it) => {
    setIntegrations((l) => l.map((x) => (x.id === it.id ? { ...x, on: !x.on } : x)));
    toast(`${it.name} ${it.on ? 'desativada' : 'ativada'}`, { icon: 'plug', tone: it.on ? 'gray' : 'green' });
  };
  return (
    <>
      <PageHeader title="Integrações" subtitle={`${integrations.filter((i) => i.on).length} de ${integrations.length} conectadas · pagamentos, logística, fiscal e marketing`}>
        <Button icon="plus" variant="primary" onClick={() => toast('Catálogo de apps em breve', { tone: 'blue', icon: 'info' })}>Explorar apps</Button>
      </PageHeader>
      <motion.div variants={rise} className="chips" style={{ marginBottom: 16 }}>
        {groups.map((g) => <button key={g} className={`chip ${group === g ? 'on' : ''}`} onClick={() => setGroup(g)}>{g}</button>)}
      </motion.div>
      <motion.div className="grid g-3" layout>
        <AnimatePresence mode="popLayout">
          {list.map((it, i) => (
            <motion.div key={it.id} layout className="card integration" initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ ...spring, delay: i * 0.03 }} whileHover={{ y: -3 }}>
              <div className="int-top">
                <span className="int-icon"><Icon name={it.icon} size={18} /></span>
                <div className="grow"><strong>{it.name}</strong><small>{it.group}</small></div>
                <Toggle checked={it.on} onChange={() => flip(it)} label={it.name} />
              </div>
              <p>{it.desc}</p>
              <div className="int-foot">
                {it.on ? <Badge tone="green" dot>Conectada</Badge> : <Badge tone="gray">Desligada</Badge>}
                <span>{it.on ? `${int(it.events)} eventos em 24 h` : 'sem eventos'}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

// ---------- Sistema ----------
export function System() {
  const toast = useToast();
  const [cache, setCache] = useState(false);
  const pts = LATENCY.map((p) => ({ ...p, full: `Hoje, ${p.label}` }));
  return (
    <>
      <PageHeader title="Sistema" subtitle="Saúde da loja, do app e dos serviços que sustentam o checkout">
        <Button icon="refresh" onClick={() => { setCache(true); setTimeout(() => { setCache(false); toast('Cache da vitrine limpo em 1,8 s', { icon: 'zap' }); }, 1200); }}>
          {cache ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} style={{ display: 'inline-flex' }}><Icon name="refresh" size={14} /></motion.span> : null}
          {cache ? 'Limpando…' : 'Limpar cache'}
        </Button>
        <Button icon="server" variant="primary" onClick={() => toast('Página de status pública aberta (demonstração)', { tone: 'blue', icon: 'globe' })}>Página de status</Button>
      </PageHeader>
      <Grid className="grid g-4">
        <Stat icon="server" tone="green" label="Disponibilidade (30 dias)" value={99.97} format={(v) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`} sub="meta contratual 99,9%" />
        <Stat icon="zap" label="Tempo de resposta (p95)" value={212} format={(v) => `${Math.round(v)} ms`} delta={-0.06} inverse sub="checkout e catálogo" />
        <Stat icon="activity" tone="violet" label="Requisições por minuto" value={48210} sub="pico de hoje: 91.400" />
        <Stat icon="alert" tone="amber" label="Incidentes abertos" value={1} sub="frete com latência alta" />
      </Grid>
      <Grid className="grid g-main" style={{ marginBottom: 0 }}>
        <Card>
          <CardHead title="Serviços" subtitle="Últimos 60 dias · cada barra é um dia">
            <Badge tone="amber" dot>1 degradado</Badge>
          </CardHead>
          {SERVICES.map((s, si) => (
            <div className="svc" key={s.name}>
              <span className="svc-name"><i className={`svc-dot ${s.status}`} />{s.name}</span>
              <span className="uptime">{s.days.map((d, i) => <motion.i key={i} className={`u${d}`} title={d ? (d === 2 ? 'Indisponibilidade parcial' : 'Degradado') : 'Operacional'} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: si * 0.05 + i * 0.006, duration: 0.25 }} />)}</span>
              <span className="n">{s.uptime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%</span>
              <span className="n">{s.latency} ms</span>
            </div>
          ))}
        </Card>
        <Card>
          <CardHead title="Latência do checkout" subtitle="Hoje, a cada 30 min (p95)" />
          <AreaChart points={pts} height={230} showPrev={false} format={(v) => `${Math.round(v)} ms`} tipFormat={(v) => `${Math.round(v)} ms`} />
          <div className="list" style={{ marginTop: 8 }}>
            {[['Fila de pedidos', '0 pendentes', 'green'], ['Workers de e-mail', '12 de 12 ativos', 'green'], ['Sincronização com ERP', 'há 4 min', 'green'], ['Cálculo de frete', 'p95 420 ms', 'amber']].map(([a, b, t]) => (
              <div className="list-row" key={a} style={{ padding: '8px 0' }}><div className="grow"><strong>{a}</strong></div><Badge tone={t} dot>{b}</Badge></div>
            ))}
          </div>
        </Card>
      </Grid>
    </>
  );
}

// ---------- Configurações ----------
export function Settings() {
  const { theme, setTheme } = useStore();
  const toast = useToast();
  const [s, setS] = useState({ name: 'Vitrine', cnpj: '12.345.678/0001-90', email: 'contato@vitrine.com.br', phone: '(11) 4002-8922', freeShip: true, freeShipMin: '299', reviews: true, stockAlert: true, twofa: true, telegram: false, maintenance: false });
  const set = (k) => (v) => setS((x) => ({ ...x, [k]: v?.target ? v.target.value : v }));
  return (
    <>
      <PageHeader title="Configurações" subtitle="Dados da loja, regras de venda, notificações e aparência">
        <Button icon="check" variant="primary" onClick={() => toast('Configurações salvas', { icon: 'settings' })}>Salvar</Button>
      </PageHeader>
      <Grid className="grid g-2">
        <Card>
          <CardHead title="Dados da loja" subtitle="Aparecem em notas fiscais e e-mails" />
          <div className="form-grid">
            <label className="field"><span>Nome fantasia</span><input className="input" value={s.name} onChange={set('name')} /></label>
            <label className="field"><span>CNPJ</span><input className="input" value={s.cnpj} onChange={set('cnpj')} /></label>
            <label className="field"><span>E-mail de contato</span><input className="input" value={s.email} onChange={set('email')} /></label>
            <label className="field"><span>Telefone</span><input className="input" value={s.phone} onChange={set('phone')} /></label>
          </div>
          <label className="field" style={{ marginBottom: 0 }}><span>Fuso horário</span><select className="select" defaultValue="sp"><option value="sp">América/São Paulo (BRT)</option><option value="mn">América/Manaus</option><option value="rb">América/Rio Branco</option></select></label>
        </Card>
        <Card>
          <CardHead title="Regras de venda" />
          <div className="setting-row"><div className="grow"><strong>Frete grátis</strong><small>Para pedidos acima do valor mínimo</small></div>
            <AnimatePresence>{s.freeShip && <motion.input initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 90 }} exit={{ opacity: 0, width: 0 }} className="input" style={{ height: 32 }} value={s.freeShipMin} onChange={set('freeShipMin')} aria-label="Valor mínimo" />}</AnimatePresence>
            <Toggle checked={s.freeShip} onChange={set('freeShip')} label="Frete grátis" />
          </div>
          <div className="setting-row"><div className="grow"><strong>Avaliações de produtos</strong><small>Clientes avaliam após a entrega</small></div><Toggle checked={s.reviews} onChange={set('reviews')} label="Avaliações" /></div>
          <div className="setting-row"><div className="grow"><strong>Alerta de estoque baixo</strong><small>Avisar quando a cobertura for menor que 7 dias</small></div><Toggle checked={s.stockAlert} onChange={set('stockAlert')} label="Alerta de estoque" /></div>
          <div className="setting-row"><div className="grow"><strong>Modo manutenção</strong><small>Mostra uma página de aviso aos clientes</small></div><Toggle checked={s.maintenance} onChange={(v) => { set('maintenance')(v); if (v) toast('Loja em manutenção (demonstração)', { tone: 'amber', icon: 'alert' }); }} label="Manutenção" /></div>
        </Card>
        <Card>
          <CardHead title="Segurança e notificações" />
          <div className="setting-row"><div className="grow"><strong>Verificação em duas etapas</strong><small>Obrigatória para quem acessa o financeiro</small></div><Toggle checked={s.twofa} onChange={set('twofa')} label="2FA" /></div>
          <div className="setting-row"><div className="grow"><strong>Resumo diário no Telegram</strong><small>Faturamento e pedidos às 08:00</small></div><Toggle checked={s.telegram} onChange={set('telegram')} label="Telegram" /></div>
          <div className="setting-row"><div className="grow"><strong>Sessões ativas</strong><small>3 dispositivos · último acesso agora</small></div><Button size="sm" variant="danger" onClick={() => toast('Outras sessões encerradas', { icon: 'lock' })}>Encerrar outras</Button></div>
        </Card>
        <Card>
          <CardHead title="Aparência" subtitle={`Logado como ${ADMIN.name}`} />
          <div className="theme-grid" style={{ padding: 0, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
            {THEMES.map((t) => (
              <button key={t.id} className={`theme-opt ${theme === t.id ? 'on' : ''}`} onClick={() => setTheme(t.id)}>
                <span className="theme-sw" style={{ background: t.sw }}>{theme === t.id && <motion.span className="theme-check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={spring}><Icon name="check" size={12} stroke={3} /></motion.span>}</span>
                {t.name}
              </button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12, margin: '12px 0 0' }}>A tipografia usa SF Pro em Mac, iPhone e iPad, com Inter como alternativa nos demais sistemas. Animações respeitam a opção “reduzir movimento” do sistema.</p>
        </Card>
      </Grid>
    </>
  );
}
