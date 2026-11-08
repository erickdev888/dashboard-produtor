import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CUSTOMERS, PERMISSIONS, ROLES, TEAM } from '../data.js';
import { Avatar, Badge, Button, Card, CardHead, Empty, Grid, Icon, IconButton, Modal, PageHeader, Pagination, SearchField, Segmented, Stat, Toggle, ago, brl, brlK, fmtTime, int, rise, spring, useToast } from '../ui.jsx';
import { HBars } from '../charts.jsx';
import { go, useStore } from '../store.jsx';

const PRIORITY = { urgente: ['red', 'Urgente'], alta: ['amber', 'Alta'], media: ['blue', 'Média'], baixa: ['gray', 'Baixa'] };

// ---------- Tarefas ----------
export function Tasks() {
  const { tasks, setTasks } = useStore();
  const [filter, setFilter] = useState('abertas');
  const [title, setTitle] = useState('');
  const [prio, setPrio] = useState('media');
  const toast = useToast();
  const list = tasks.filter((t) => filter === 'todas' || (filter === 'abertas' ? !t.done : t.done));
  const add = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setTasks((l) => [{ id: 'k' + Date.now(), title: title.trim(), who: 'Erick Umbelino', priority: prio, due: 'Hoje', done: false, tag: 'Geral' }, ...l]);
    setTitle('');
    toast('Tarefa criada', { icon: 'tasks' });
  };
  const toggle = (id) => setTasks((l) => l.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (t) => { setTasks((l) => l.filter((x) => x.id !== t.id)); toast('Tarefa excluída', { tone: 'gray', icon: 'trash', action: { label: 'Desfazer', run: () => setTasks((l) => [t, ...l]) } }); };
  const done = tasks.filter((t) => t.done).length;
  return (
    <>
      <PageHeader title="Tarefas" subtitle={`${tasks.length - done} em aberto · ${done} concluídas`} />
      <Grid className="grid g-main">
        <Card>
          <CardHead title="Quadro da equipe" subtitle="Marque para concluir, crie novas com prioridade">
            <Segmented value={filter} onChange={setFilter} options={[{ id: 'abertas', label: 'Abertas', count: tasks.length - done }, { id: 'feitas', label: 'Concluídas', count: done }, { id: 'todas', label: 'Todas' }]} />
          </CardHead>
          <form className="add-task" onSubmit={add}>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nova tarefa… (Enter para adicionar)" />
            <select className="select" style={{ width: 130 }} value={prio} onChange={(e) => setPrio(e.target.value)} aria-label="Prioridade">
              {Object.entries(PRIORITY).map(([k, [, l]]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <Button variant="primary" icon="plus" type="submit">Adicionar</Button>
          </form>
          <div style={{ marginTop: 8 }}>
            <AnimatePresence initial={false} mode="popLayout">
              {list.map((t) => (
                <motion.div key={t.id} layout className={`task ${t.done ? 'done' : ''}`} initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }} transition={spring}>
                  <motion.button className={`check ${t.done ? 'on' : ''}`} onClick={() => toggle(t.id)} whileTap={{ scale: 0.8 }} aria-label={t.done ? 'Reabrir' : 'Concluir'}>
                    <AnimatePresence>{t.done && <motion.svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><motion.path d="M20 6 9 17l-5-5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} /></motion.svg>}</AnimatePresence>
                  </motion.button>
                  <div className="task-title">
                    {t.title}
                    <motion.span className="strike" initial={false} animate={{ width: t.done ? '100%' : '0%' }} transition={{ duration: 0.35 }} />
                    <div className="task-meta" style={{ marginTop: 3 }}><Avatar name={t.who} size={18} />{t.who.split(' ')[0]} · {t.tag}</div>
                  </div>
                  <Badge tone={PRIORITY[t.priority][0]}>{PRIORITY[t.priority][1]}</Badge>
                  <span className="task-meta" style={{ width: 86, justifyContent: 'flex-end' }}><Icon name="calendar" size={13} />{t.due}</span>
                  <IconButton icon="trash" label="Excluir" onClick={() => remove(t)} />
                </motion.div>
              ))}
            </AnimatePresence>
            {!list.length && <Empty icon="checkCircle" title="Nada por aqui" text="Todas as tarefas desta lista foram concluídas." />}
          </div>
        </Card>
        <div className="stack">
          <Stat icon="tasks" label="Concluídas" value={done / Math.max(1, tasks.length) * 100} format={(v) => `${Math.round(v)}%`} sub={`${done} de ${tasks.length} tarefas`} />
          <Card>
            <CardHead title="Carga por pessoa" subtitle="Tarefas em aberto" />
            <HBars format={(v) => int(v)} rows={Object.entries(tasks.filter((t) => !t.done).reduce((m, t) => ((m[t.who] = (m[t.who] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]).map(([who, n]) => ({ label: who, value: n, lead: <Avatar name={who} size={22} /> }))} />
          </Card>
        </div>
      </Grid>
    </>
  );
}

// ---------- Equipe ----------
export function Team() {
  const [team, setTeam] = useState(TEAM);
  const [group, setGroup] = useState('Todos');
  const [invite, setInvite] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'Catálogo' });
  const toast = useToast();
  const groups = ['Todos', ...new Set(TEAM.map((t) => t.team))];
  const list = team.filter((t) => group === 'Todos' || t.team === group);
  const online = team.filter((t) => t.status === 'online').length;
  return (
    <>
      <PageHeader title="Equipe" subtitle={`${team.length} pessoas · ${online} online agora`}>
        <Button icon="plus" variant="primary" onClick={() => setInvite(true)}>Convidar pessoa</Button>
      </PageHeader>
      <motion.div variants={rise} className="chips" style={{ marginBottom: 16 }}>
        {groups.map((g) => <button key={g} className={`chip ${group === g ? 'on' : ''}`} onClick={() => setGroup(g)}>{g}</button>)}
      </motion.div>
      <motion.div className="grid g-4" layout>
        <AnimatePresence mode="popLayout">
          {list.map((m, i) => (
            <motion.div key={m.id} layout initial={{ opacity: 0, scale: 0.92, filter: 'blur(6px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 0.92 }} transition={{ ...spring, delay: i * 0.025 }} whileHover={{ y: -4 }} className="card member">
              <Avatar name={m.name} size={58} status={m.status} tone={i === 0 && m.role === 'Proprietário' ? 'me' : undefined} />
              <strong>{m.name}</strong>
              <small>{m.role}</small>
              <div className="member-stats">
                <Badge tone={m.status === 'online' ? 'green' : m.status === 'away' ? 'amber' : 'gray'} dot>{m.status === 'online' ? 'Online' : m.status === 'away' ? 'Ausente' : 'Offline'}</Badge>
                <Badge tone="gray">{m.team}</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 10 }}>
                <IconButton icon="mail" label={`E-mail para ${m.name}`} onClick={() => toast(`Abrindo e-mail para ${m.email}`, { icon: 'mail', tone: 'blue' })} />
                <IconButton icon="chat" label="Mensagem" onClick={() => toast(`Mensagem enviada para ${m.name.split(' ')[0]}`, { icon: 'chat' })} />
                <IconButton icon="shield" label="Permissões" onClick={() => go('funcoes')} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      <Modal open={invite} onClose={() => setInvite(false)} title="Convidar pessoa" subtitle="Ela recebe um e-mail para criar a senha e ativar o acesso."
        footer={<><Button variant="ghost" onClick={() => setInvite(false)}>Cancelar</Button><Button variant="primary" icon="send" disabled={!form.name || !form.email.includes('@')} onClick={() => { setTeam((t) => [...t, { id: 't' + Date.now(), name: form.name, role: form.role, team: form.role, status: 'offline', email: form.email, tasks: 0 }]); toast(`Convite enviado para ${form.email}`, { icon: 'send' }); setInvite(false); setForm({ name: '', email: '', role: 'Catálogo' }); }}>Enviar convite</Button></>}>
        <label className="field"><span>Nome</span><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></label>
        <label className="field"><span>E-mail</span><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nome@vitrine.com.br" /></label>
        <label className="field"><span>Função</span><select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.slice(1).map((r) => <option key={r.id}>{r.name}</option>)}</select></label>
      </Modal>
    </>
  );
}

// ---------- Funções e acesso ----------
export function Roles() {
  const [matrix, setMatrix] = useState(() => Object.fromEntries(PERMISSIONS.map(([k, , roles]) => [k, Object.fromEntries(ROLES.map((r) => [r.id, roles.includes(r.id)]))])));
  const toast = useToast();
  const flip = (perm, role) => {
    if (role === 'owner') { toast('O proprietário sempre tem acesso total', { tone: 'amber', icon: 'lock' }); return; }
    setMatrix((m) => ({ ...m, [perm]: { ...m[perm], [role]: !m[perm][role] } }));
  };
  return (
    <>
      <PageHeader title="Funções e acesso" subtitle="Quem pode fazer o quê na loja. Alterações valem no próximo login.">
        <Button icon="check" variant="primary" onClick={() => toast('Permissões salvas', { icon: 'shield' })}>Salvar alterações</Button>
      </PageHeader>
      <Grid className="grid g-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
        {ROLES.map((r) => (
          <Card key={r.id} hover>
            <span className="stat-icon tone-soft-blue" style={{ marginBottom: 10 }}><Icon name={r.id === 'owner' ? 'star' : 'shield'} size={15} /></span>
            <div style={{ fontWeight: 650 }}>{r.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>{r.members} {r.members === 1 ? 'pessoa' : 'pessoas'} · {Object.values(matrix).filter((m) => m[r.id]).length} permissões</div>
          </Card>
        ))}
      </Grid>
      <Card className="flush">
        <div className="table-wrap scroll">
          <table className="table perm-table">
            <thead><tr><th>Permissão</th>{ROLES.map((r) => <th key={r.id}>{r.name}</th>)}</tr></thead>
            <tbody>
              {PERMISSIONS.map(([k, label], i) => (
                <motion.tr key={k} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.03 }}>
                  <td className="perm-name">{label}<small>{k}</small></td>
                  {ROLES.map((r) => <td key={r.id}><Toggle checked={matrix[k][r.id]} onChange={() => flip(k, r.id)} label={`${label} — ${r.name}`} /></td>)}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ---------- Clientes ----------
const TIERS = { Diamante: 'violet', Ouro: 'amber', Prata: 'blue', Bronze: 'gray' };
export function Clients({ params }) {
  const [q, setQ] = useState(params.q || '');
  const [tier, setTier] = useState('todos');
  const [page, setPage] = useState(0);
  useEffect(() => { if (params.q) setQ(params.q); }, [params.q]);
  useEffect(() => setPage(0), [q, tier]);
  const list = CUSTOMERS.filter((c) => (tier === 'todos' || c.tier === tier) && (!q || c.name.toLowerCase().includes(q.toLowerCase()) || c.email.includes(q.toLowerCase()) || c.city.toLowerCase().includes(q.toLowerCase())));
  const PER = 10;
  const ltv = CUSTOMERS.reduce((s, c) => s + c.ltv, 0);
  const byUf = Object.entries(CUSTOMERS.reduce((m, c) => ((m[c.uf] = (m[c.uf] || 0) + c.ltv), m), {})).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return (
    <>
      <PageHeader title="Clientes" subtitle="Base de compradores, recorrência e valor ao longo do tempo (LTV)">
        <Button icon="megaphone" onClick={() => go('comunicados')}>Criar campanha</Button>
      </PageHeader>
      <Grid className="grid g-4">
        <Stat icon="team" label="Clientes ativos (12 meses)" value={182340} delta={0.091} sub="compraram ao menos 1 vez" />
        <Stat icon="refresh" tone="violet" label="Taxa de recompra" value={31.4} format={(v) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`} delta={0.021} sub="em até 180 dias" />
        <Stat icon="wallet" tone="green" label="LTV médio" value={ltv / CUSTOMERS.length} format={brl} sub="receita por cliente" />
        <Stat icon="star" tone="amber" label="NPS" value={72} sub="412 respostas no mês" delta={0.04} />
      </Grid>
      <Grid className="grid g-main" style={{ marginBottom: 0 }}>
        <Card className="flush">
          <div className="card-head">
            <Segmented value={tier} onChange={setTier} options={[{ id: 'todos', label: 'Todos' }, ...Object.keys(TIERS).map((t) => ({ id: t, label: t, count: CUSTOMERS.filter((c) => c.tier === t).length }))]} />
            <SearchField value={q} onChange={setQ} placeholder="Nome, e-mail ou cidade" />
          </div>
          <div className="table-wrap scroll">
            <table className="table">
              <thead><tr><th>Cliente</th><th>Local</th><th>Nível</th><th className="n">Pedidos</th><th className="n">LTV</th><th className="n">Última compra</th></tr></thead>
              <tbody>
                {list.slice(page * PER, page * PER + PER).map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}>
                    <td><div className="cell-main"><Avatar name={c.name} size={32} /><div><strong>{c.name}</strong><small>{c.email}</small></div></div></td>
                    <td className="muted">{c.city} · {c.uf}</td>
                    <td><Badge tone={TIERS[c.tier]}>{c.tier}</Badge></td>
                    <td className="n tnum">{c.orders}</td>
                    <td className="n tnum"><strong>{brl(c.ltv)}</strong></td>
                    <td className="n muted">{c.last === 0 ? 'hoje' : `há ${c.last} d`}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {!list.length && <Empty title="Nenhum cliente encontrado" />}
          </div>
          <Pagination page={page} pages={Math.ceil(list.length / PER)} onChange={setPage} />
        </Card>
        <Card>
          <CardHead title="LTV por estado" subtitle="Clientes desta amostra" />
          <HBars rows={byUf.map(([uf, v]) => ({ label: uf, value: v }))} format={brlK} />
        </Card>
      </Grid>
    </>
  );
}

// ---------- Atendimento ----------
const ST = { aberto: ['red', 'Aberto'], andamento: ['amber', 'Em andamento'], resolvido: ['green', 'Resolvido'] };
export function Support() {
  const { tickets, setTickets } = useStore();
  const [tab, setTab] = useState('aberto');
  const [selId, setSelId] = useState(tickets[0].id);
  const [msg, setMsg] = useState('');
  const [threads, setThreads] = useState({});
  const toast = useToast();
  const list = tickets.filter((t) => tab === 'todos' || t.status === tab);
  const sel = tickets.find((t) => t.id === selId) || list[0];
  const base = sel ? [
    { me: false, text: `Olá! ${sel.subject}. Meu pedido é o ${sel.order.id}.`, time: ago(sel.ago) },
    { me: true, text: `Oi, ${sel.customer.name.split(' ')[0]}! Sou ${sel.agent.name.split(' ')[0]} e já estou verificando o pedido ${sel.order.id} para você.`, time: ago(Math.max(1, sel.ago - 3)) },
  ] : [];
  const thread = sel ? [...base, ...(threads[sel.id] || [])] : [];
  const send = (e) => {
    e.preventDefault();
    if (!msg.trim() || !sel) return;
    setThreads((t) => ({ ...t, [sel.id]: [...(t[sel.id] || []), { me: true, text: msg.trim(), time: 'agora' }] }));
    if (sel.status === 'aberto') setTickets((l) => l.map((t) => (t.id === sel.id ? { ...t, status: 'andamento' } : t)));
    setMsg('');
  };
  const resolve = () => { setTickets((l) => l.map((t) => (t.id === sel.id ? { ...t, status: 'resolvido' } : t))); toast(`Ticket ${sel.id} resolvido`, { icon: 'checkCircle' }); };
  return (
    <>
      <PageHeader title="Atendimento" subtitle="Tickets de clientes vindos de WhatsApp, chat, e-mail e telefone" />
      <Grid className="grid g-4">
        <Stat icon="support" tone="red" label="Abertos" value={tickets.filter((t) => t.status === 'aberto').length} sub="aguardando 1ª resposta" />
        <Stat icon="clock" tone="amber" label="Tempo de 1ª resposta" value={14} format={(v) => `${Math.round(v)} min`} delta={-0.18} inverse sub="média de hoje" />
        <Stat icon="checkCircle" tone="green" label="Resolvidos no 1º contato" value={68} format={(v) => `${Math.round(v)}%`} delta={0.05} />
        <Stat icon="star" tone="violet" label="Satisfação (CSAT)" value={4.7} format={(v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} sub="de 5 · 1.204 avaliações" />
      </Grid>
      <motion.div className="support-layout" variants={rise}>
        <div className="card">
          <div style={{ marginBottom: 10 }}>
            <Segmented className="seg-wide" value={tab} onChange={setTab} options={[{ id: 'aberto', label: 'Abertos', count: tickets.filter((t) => t.status === 'aberto').length }, { id: 'andamento', label: 'Andamento', count: tickets.filter((t) => t.status === 'andamento').length }, { id: 'resolvido', label: 'Resolvidos' }, { id: 'todos', label: 'Todos' }]} />
          </div>
          <div className="scroll" style={{ maxHeight: 520, margin: '0 -6px', padding: '0 6px' }}>
            <AnimatePresence initial={false} mode="popLayout">
              {list.map((t) => (
                <motion.button key={t.id} layout className="ticket" onClick={() => setSelId(t.id)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}>
                  {sel?.id === t.id && <motion.span layoutId="ticket-sel" className="ticket-sel" transition={spring} />}
                  <Avatar name={t.customer.name} size={36} />
                  <div className="grow"><strong>{t.subject}</strong><small>{t.customer.name} · {t.channel} · {t.id}</small></div>
                  <div className="ticket-side"><Badge tone={PRIORITY[t.priority][0]}>{PRIORITY[t.priority][1]}</Badge>{ago(t.ago)}</div>
                </motion.button>
              ))}
            </AnimatePresence>
            {!list.length && <Empty icon="checkCircle" title="Fila vazia" text="Nenhum ticket com este status." />}
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          {sel ? (
            <AnimatePresence mode="wait">
              <motion.div key={sel.id} initial={{ opacity: 0, x: 12, filter: 'blur(6px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -12, filter: 'blur(6px)' }} transition={{ duration: 0.25 }} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div className="card-head">
                  <div><h3>{sel.subject}</h3><p>{sel.id} · pedido {sel.order.id} · {brl(sel.order.total)} · responsável {sel.agent.name}</p></div>
                  <div className="card-actions">
                    <Badge tone={ST[sel.status][0]} dot>{ST[sel.status][1]}</Badge>
                    <Button size="sm" variant="ghost" icon="cart" onClick={() => go('pedidos', { o: sel.order.id.slice(1) })}>Pedido</Button>
                    {sel.status !== 'resolvido' && <Button size="sm" variant="good" icon="check" onClick={resolve}>Resolver</Button>}
                  </div>
                </div>
                <div className="chat scroll" style={{ flex: 1, maxHeight: 380 }}>
                  <AnimatePresence initial={false}>
                    {thread.map((m, i) => (
                      <motion.div key={i} className={`bubble ${m.me ? 'me' : 'them'}`} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}>
                        {m.text}<small>{m.time}</small>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <form className="composer" onSubmit={send}>
                  <input className="input" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={`Responder ${sel.customer.name.split(' ')[0]} via ${sel.channel}…`} />
                  <Button variant="primary" icon="send" type="submit" disabled={!msg.trim()}>Enviar</Button>
                </form>
              </motion.div>
            </AnimatePresence>
          ) : <Empty title="Selecione um ticket" />}
        </div>
      </motion.div>
    </>
  );
}

// ---------- Comunicados ----------
export function Announcements() {
  const { announcements, setAnnouncements } = useStore();
  const [tab, setTab] = useState('todos');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', body: '', audience: 'Todos', when: 'agora', telegram: true });
  const toast = useToast();
  const counts = { todos: announcements.length, sent: announcements.filter((a) => a.status === 'sent').length, scheduled: announcements.filter((a) => a.status === 'scheduled').length, pinned: announcements.filter((a) => a.pinned).length };
  const list = [...announcements].filter((a) => tab === 'todos' || (tab === 'pinned' ? a.pinned : a.status === tab)).sort((a, b) => b.pinned - a.pinned);
  const publish = () => {
    const a = { id: 'a' + Date.now(), title: f.title, body: f.body, audience: f.audience, status: f.when === 'agora' ? 'sent' : 'scheduled', pinned: false, date: f.when === 'agora' ? 'agora' : 'amanhã, 09:00', read: 0, total: f.audience === 'Todos' ? 13 : 4 };
    setAnnouncements((l) => [a, ...l]);
    toast(f.when === 'agora' ? `Comunicado enviado no app${f.telegram ? ' e no Telegram' : ''}` : 'Comunicado agendado para amanhã, 09:00', { icon: 'megaphone' });
    setF({ title: '', body: '', audience: 'Todos', when: 'agora', telegram: true });
    setOpen(false);
  };
  return (
    <>
      <PageHeader title="Comunicados" subtitle="Avise a equipe no painel e no Telegram">
        <Button icon="plus" variant="primary" onClick={() => setOpen(true)}>Novo comunicado</Button>
      </PageHeader>
      <motion.div variants={rise} style={{ marginBottom: 16 }}>
        <Segmented className="seg-wide" value={tab} onChange={setTab} options={[{ id: 'todos', label: 'Todos', count: counts.todos }, { id: 'sent', label: 'Enviados', count: counts.sent }, { id: 'scheduled', label: 'Agendados', count: counts.scheduled }, { id: 'pinned', label: 'Fixados', count: counts.pinned }]} />
      </motion.div>
      <AnimatePresence mode="popLayout" initial={false}>
        {list.map((a, i) => (
          <motion.article key={a.id} layout className="card ann" initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }} transition={{ ...spring, delay: i * 0.04 }}>
            <div className="ann-head">
              {a.pinned && <Icon name="pin" size={15} style={{ color: 'var(--accent)' }} />}
              <h4>{a.title}</h4>
              {a.status === 'sent' ? <Badge tone="green" dot>Enviado</Badge> : <Badge tone="violet" icon="clock">Agendado</Badge>}
            </div>
            <p>{a.body}</p>
            <div className="ann-foot">
              <Badge tone="gray">{a.audience}</Badge>
              <span>{a.date}</span>
              {a.status === 'sent' && (
                <span className="ann-read">
                  <span className="progress" style={{ height: 5 }}><motion.span className="progress-fill tone-fill-blue" style={{ display: 'block' }} initial={{ width: 0 }} animate={{ width: `${(a.read / a.total) * 100}%` }} transition={{ duration: 0.9, delay: 0.2 }} /></span>
                  {a.read} de {a.total} leram
                </span>
              )}
              <span className="ann-actions">
                <Button size="sm" variant="ghost" icon="pin" onClick={() => setAnnouncements((l) => l.map((x) => (x.id === a.id ? { ...x, pinned: !x.pinned } : x)))}>{a.pinned ? 'Desafixar' : 'Fixar'}</Button>
                <IconButton icon="trash" label="Excluir" onClick={() => { setAnnouncements((l) => l.filter((x) => x.id !== a.id)); toast('Comunicado excluído', { tone: 'gray', icon: 'trash', action: { label: 'Desfazer', run: () => setAnnouncements((l) => [a, ...l]) } }); }} />
              </span>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
      {!list.length && <Card><Empty icon="megaphone" title="Nenhum comunicado aqui" /></Card>}
      <Modal open={open} onClose={() => setOpen(false)} title="Novo comunicado" subtitle="Aparece no topo do painel de quem for incluído."
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button variant="primary" icon="send" disabled={!f.title.trim() || !f.body.trim()} onClick={publish}>{f.when === 'agora' ? 'Enviar agora' : 'Agendar'}</Button></>}>
        <label className="field"><span>Título</span><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: Mudança no horário do CD" autoFocus /></label>
        <label className="field"><span>Mensagem</span><textarea className="textarea" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></label>
        <div className="form-grid">
          <label className="field"><span>Público</span><select className="select" value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })}>{['Todos', 'Catálogo', 'Atendimento', 'Operações', 'Financeiro', 'Marketing'].map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="field"><span>Quando</span><select className="select" value={f.when} onChange={(e) => setF({ ...f, when: e.target.value })}><option value="agora">Enviar agora</option><option value="amanha">Amanhã às 09:00</option></select></label>
        </div>
        <div className="setting-row" style={{ borderBottom: 0, paddingTop: 0 }}><div className="grow"><strong>Enviar também no Telegram</strong><small>Grupo interno da equipe</small></div><Toggle checked={f.telegram} onChange={(v) => setF({ ...f, telegram: v })} label="Telegram" /></div>
      </Modal>
    </>
  );
}
