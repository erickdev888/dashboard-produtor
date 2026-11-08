import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CATEGORIES, DATES, LAST, PERIODS, PRODUCTS, TODAY, catById, monthly, periodRange, productStats, seriesFor, sumRev, sumUnits } from '../data.js';
import { Badge, Button, Card, CardHead, Delta, Drawer, Empty, Grid, Icon, Modal, PageHeader, ProductArt, SearchField, Segmented, Stat, brl, brlK, downloadCSV, int, pct, useToast } from '../ui.jsx';
import { AreaChart, BarChart, HBars, LegendRow, Sparkline } from '../charts.jsx';
import { go, useStore } from '../store.jsx';

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const PERIOD_OPTS = [...PERIODS, { id: 'custom', label: 'Personalizado' }];
const COLS = [
  { key: 'revenue', label: 'Faturamento' },
  { key: 'units', label: 'Unidades' },
  { key: 'ticket', label: 'Ticket médio' },
  { key: 'delta', label: 'Variação' },
  { key: 'share', label: 'Participação' },
];

// Valores diários do período (reduzidos a no máx. ~30 pontos) para a minitendência
function sparkValues(p, r) {
  const a = r.len < 3 ? LAST - 13 : r.start, b = r.end;
  const len = b - a + 1, step = Math.max(1, Math.ceil(len / 30));
  const out = [];
  for (let t = a; t <= b; t += step) out.push(sumRev(p, t, Math.min(b, t + step - 1)));
  return out;
}

function PeriodPicker({ period, setPeriod, custom, setCustom, range }) {
  return (
    <motion.div className="period-bar" variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
      <Segmented options={PERIOD_OPTS} value={period} onChange={setPeriod} />
      <AnimatePresence>
        {period === 'custom' && (
          <motion.div className="custom-range" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} style={{ overflow: 'hidden' }}>
            <input type="date" className="date-input" aria-label="Data inicial" value={custom.from} min={iso(DATES[365])} max={custom.to} onChange={(e) => e.target.value && setCustom({ ...custom, from: e.target.value })} />
            até
            <input type="date" className="date-input" aria-label="Data final" value={custom.to} min={custom.from} max={iso(TODAY)} onChange={(e) => e.target.value && setCustom({ ...custom, to: e.target.value })} />
          </motion.div>
        )}
      </AnimatePresence>
      <span className="period-label"><Icon name="calendar" size={14} />{range.label} · {range.len === 1 ? (range.end === LAST ? 'comparado a ontem no mesmo horário' : 'comparado ao dia anterior') : `comparado aos ${range.len} dias anteriores`}</span>
    </motion.div>
  );
}

function ProductDrawer({ row, range, period, setPeriod, onClose }) {
  const p = row?.p;
  const pts = useMemo(() => (p ? seriesFor(range, [p]).points : []), [p, range.start, range.end]);
  const months = useMemo(() => (p ? monthly(12, [p]) : []), [p]);
  const daily30 = p ? sumUnits(p, LAST - 29, LAST) / 30 : 0;
  const cover = daily30 ? p.stock / daily30 : Infinity;
  return (
    <Drawer open={!!p} onClose={onClose} width={620} header={p && (
      <div className="product-hero" style={{ marginBottom: 0 }}>
        <ProductArt art={p.art} cat={p.cat} size={64} radius={18} />
        <div>
          <h3>{p.name}</h3>
          <p>{p.sku} · {catById[p.cat].name} · {brl(p.price)} · <span className="stars"><Icon name="star" size={12} />{p.rating.toLocaleString('pt-BR')}</span> ({int(p.reviews)})</p>
        </div>
      </div>
    )}>
      {p && <>
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} style={{ marginBottom: 14 }}>
          <Segmented options={PERIODS} value={period === 'custom' ? '' : period} onChange={setPeriod} />
        </motion.div>
        <motion.div className="kv" variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
          <div><span>Faturamento · {range.label}</span><strong>{brl(row.revenue)}</strong></div>
          <div><span>Variação vs. período anterior</span><strong><Delta value={row.delta} /></strong></div>
          <div><span>Unidades vendidas</span><strong>{int(row.units)}</strong></div>
          <div><span>Ticket médio</span><strong>{brl(row.ticket)}</strong></div>
          <div><span>Margem bruta estimada</span><strong>{brl(row.margin)}</strong></div>
          <div><span>Participação no faturamento</span><strong>{pct(row.share, 2)}</strong></div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
          <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Faturamento no período
            <LegendRow items={[{ label: 'Atual', color: 'var(--s1)' }, { label: 'Anterior', color: 'var(--ink-3)', dashed: true }]} />
          </div>
          <AreaChart points={pts} height={220} />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
          <div className="section-title">Por canal de venda</div>
          {Object.entries(p.channels).map(([ch, share], i) => (
            <div className="channel-row" key={ch}>
              <span>{ch}</span>
              <div className="hbar-track"><motion.div className="hbar-fill" style={{ background: `var(--s${i + 1})` }} initial={{ width: 0 }} animate={{ width: `${share * 100}%` }} transition={{ duration: 0.9, delay: 0.2 + i * 0.1 }} /></div>
              <b>{brlK(row.revenue * share)}</b>
            </div>
          ))}
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
          <div className="section-title">Últimos 12 meses</div>
          <BarChart data={months} height={190} accentLast extra={(d) => <span className="tip-row">{int(d.units)} unidades</span>} />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
          <div className="section-title">Estoque</div>
          <div className="kv">
            <div><span>Em estoque</span><strong>{int(p.stock)} un.</strong></div>
            <div><span>Cobertura no ritmo de 30 dias</span><strong style={{ color: cover < 7 ? 'var(--bad)' : undefined }}>{isFinite(cover) ? `${Math.round(cover)} dias` : '—'}</strong></div>
            <div><span>Vendido por</span><strong style={{ fontSize: 14 }}>{p.seller}</strong></div>
            <div><span>Média diária (30 dias)</span><strong>{daily30.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} un.</strong></div>
          </div>
        </motion.div>
      </>}
    </Drawer>
  );
}

function NewProductModal({ open, onClose }) {
  const { setListings } = useStore();
  const toast = useToast();
  const [f, setF] = useState({ name: '', cat: 'hardware', price: '', stock: '' });
  const ok = f.name.trim().length > 3 && Number(f.price) > 0;
  const submit = () => {
    const c = catById[f.cat];
    const art = PRODUCTS.find((p) => p.cat === f.cat).art;
    setListings((l) => [{ id: 'l' + Date.now(), title: f.name.trim(), art, cat: f.cat, price: Number(f.price), seller: 'Vitrine Oficial', checks: [['warn', 'Aguardando fotos']], photos: 0, sellerId: 'VT-OFICIAL', ago: 0, type: 'Novo', state: 'review' }, ...l]);
    toast(`“${f.name.trim()}” enviado para a fila de moderação (${c.name})`, { icon: 'moderation', action: { label: 'Abrir', run: () => go('moderacao') } });
    setF({ name: '', cat: 'hardware', price: '', stock: '' });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Novo produto" subtitle="O cadastro passa pela moderação de catálogo antes de ir ao ar."
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="primary" icon="check" disabled={!ok} onClick={submit}>Cadastrar</Button></>}>
      <label className="field"><span>Nome do produto</span><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: Smart TV 50&quot; 4K" autoFocus /></label>
      <div className="form-grid">
        <label className="field"><span>Categoria</span>
          <select className="select" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </label>
        <label className="field"><span>Preço (R$)</span><input className="input" type="number" min="0" step="0.01" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} placeholder="0,00" /></label>
        <label className="field"><span>Estoque inicial</span><input className="input" type="number" min="0" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} placeholder="0" /></label>
      </div>
    </Modal>
  );
}

export default function Products({ params }) {
  const [period, setPeriodState] = useState(params.periodo || '30d');
  const [custom, setCustom] = useState({ from: iso(DATES[LAST - 44]), to: iso(DATES[LAST - 15]) });
  const [cat, setCat] = useState(null);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ key: 'revenue', dir: -1 });
  const [selId, setSelId] = useState(params.p || null);
  const [newOpen, setNewOpen] = useState(!!params.novo);
  const toast = useToast();

  useEffect(() => { if (params.p) setSelId(params.p); if (params.periodo) setPeriodState(params.periodo); if (params.novo) setNewOpen(true); }, [params.p, params.periodo, params.novo]);
  const setPeriod = (id) => id && setPeriodState(id);

  const range = useMemo(() => periodRange(period, { from: fromIso(custom.from), to: fromIso(custom.to) }), [period, custom]);
  const stats = useMemo(() => productStats(range), [range]);

  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const filtered = stats.rows.filter((r) => (!cat || r.p.cat === cat) && (!q || norm(r.p.name).includes(norm(q)) || r.p.sku.toLowerCase().includes(q.toLowerCase())));
  const sorted = [...filtered].sort((a, b) => sort.dir * ((a[sort.key] ?? a.p[sort.key]) - (b[sort.key] ?? b.p[sort.key])));
  const rankOf = useMemo(() => Object.fromEntries([...stats.rows].sort((a, b) => b.revenue - a.revenue).map((r, i) => [r.p.id, i + 1])), [stats]);

  const fTotal = filtered.reduce((s, r) => s + r.revenue, 0);
  const fUnits = filtered.reduce((s, r) => s + r.units, 0);
  const fPrev = filtered.reduce((s, r) => s + r.prev, 0);
  const fPrevUnits = filtered.reduce((s, r) => s + r.prevUnits, 0);
  const fMargin = filtered.reduce((s, r) => s + r.margin, 0);
  const fPrevMargin = filtered.reduce((s, r) => s + r.prev * (1 - r.p.cost), 0);
  const ticket = fUnits ? fTotal / fUnits : 0, prevTicket = fPrevUnits ? fPrev / fPrevUnits : 0;
  const series = useMemo(() => seriesFor(range, filtered.map((r) => r.p)), [range, cat, q]);
  const top = [...filtered].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const sel = selId ? stats.rows.find((r) => r.p.id === selId) : null;

  const exportCsv = () => {
    downloadCSV(`faturamento-por-produto_${iso(DATES[range.start])}_${iso(DATES[range.end])}.csv`,
      ['Posição', 'SKU', 'Produto', 'Categoria', 'Preço', 'Unidades', 'Faturamento', 'Ticket médio', 'Faturamento período anterior', 'Variação %', 'Participação %', 'Margem bruta estimada', 'Estoque'],
      sorted.map((r) => [rankOf[r.p.id], r.p.sku, r.p.name, catById[r.p.cat].name, r.p.price.toFixed(2).replace('.', ','), r.units, r.revenue.toFixed(2).replace('.', ','), r.ticket.toFixed(2).replace('.', ','), r.prev.toFixed(2).replace('.', ','), (r.delta * 100).toFixed(1).replace('.', ','), (r.share * 100).toFixed(2).replace('.', ','), r.margin.toFixed(2).replace('.', ','), r.p.stock]));
    toast(`CSV exportado com ${sorted.length} produtos · ${range.label}`, { icon: 'download' });
  };
  const SortTh = ({ k, children, n = true }) => (
    <th className={n ? 'n' : ''}>
      <button className={sort.key === k ? 'sorted' : ''} onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? -s.dir : -1 }))}>
        {children}
        {sort.key === k && <motion.span layoutId="sort-arrow" style={{ display: 'inline-flex' }}><Icon name={sort.dir < 0 ? 'chevronDown' : 'chevronDown'} size={12} style={{ transform: sort.dir > 0 ? 'rotate(180deg)' : 'none' }} /></motion.span>}
      </button>
    </th>
  );

  return (
    <>
      <PageHeader title="Produtos" subtitle={`Quanto cada produto faturou · ${range.label}`}>
        <Button icon="download" onClick={exportCsv}>Exportar CSV</Button>
        <Button icon="plus" variant="primary" onClick={() => setNewOpen(true)}>Novo produto</Button>
      </PageHeader>

      <PeriodPicker period={period} setPeriod={setPeriod} custom={custom} setCustom={setCustom} range={range} />

      <Grid className="grid g-4">
        <Stat icon="dollar" tone="green" label="Faturamento" value={fTotal} format={brl} delta={fPrev ? (fTotal - fPrev) / fPrev : 0} sub={`anterior: ${brlK(fPrev)}`} />
        <Stat icon="package" label="Unidades vendidas" value={fUnits} delta={fPrevUnits ? (fUnits - fPrevUnits) / fPrevUnits : 0} sub={`${filtered.filter((r) => r.units > 0).length} de ${filtered.length} produtos venderam`} />
        <Stat icon="tag" tone="violet" label="Ticket médio por unidade" value={ticket} format={brl} delta={prevTicket ? (ticket - prevTicket) / prevTicket : 0} sub={`anterior: ${brl(prevTicket)}`} />
        <Stat icon="percent" tone="amber" label="Margem bruta estimada" value={fMargin} format={brlK} delta={fPrevMargin ? (fMargin - fPrevMargin) / fPrevMargin : 0} sub={`${pct(fTotal ? fMargin / fTotal : 0)} do faturamento`} />
      </Grid>

      <Grid className="grid g-main">
        <Card>
          <CardHead title="Faturamento no período" subtitle={`${{ hour: 'Por hora', day: 'Por dia', week: 'Por semana', month: 'Por mês' }[series.bucket]}${cat ? ' · ' + catById[cat].name : ''}${q ? ` · busca “${q}”` : ''}`}>
            <LegendRow items={[{ label: 'Período atual', color: 'var(--s1)' }, { label: 'Período anterior', color: 'var(--ink-3)', dashed: true }]} />
          </CardHead>
          <AreaChart points={series.points} height={348} />
        </Card>
        <Card>
          <CardHead title="Ranking de faturamento" subtitle="Clique para ver o detalhe do produto" />
          {top.length ? (
            <HBars compact rows={top.map((r) => ({ key: r.p.id, label: r.p.name, value: r.revenue, title: `${int(r.units)} un. · ${pct(r.share)} do total`, lead: <ProductArt art={r.p.art} cat={r.p.cat} size={24} radius={7} />, color: `var(--s${catById[r.p.cat].index + 1})` }))} onSelect={(r) => setSelId(r.key)} />
          ) : <Empty title="Nenhum produto" text="Ajuste a busca ou a categoria." />}
        </Card>
      </Grid>

      <Card className="flush">
        <div className="card-head">
          <div><h3>Faturamento por produto</h3><p>{filtered.length} produtos · total {brl(fTotal)} · clique no cabeçalho para ordenar</p></div>
          <div className="card-actions"><SearchField value={q} onChange={setQ} placeholder="Buscar por nome ou SKU" /></div>
        </div>
        <div className="toolbar" style={{ padding: '0 20px' }}>
          <div className="chips">
            <button className={`chip ${!cat ? 'on' : ''}`} onClick={() => setCat(null)}>Todas</button>
            {CATEGORIES.map((c, i) => (
              <button key={c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(cat === c.id ? null : c.id)}>
                <i style={{ background: `var(--s${i + 1})` }} />{c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="table-wrap tall scroll">
          <table className="table">
            <thead>
              <tr>
                <th>#</th><th>Produto</th>
                {COLS.map((c) => <SortTh key={c.key} k={c.key}>{c.label}</SortTh>)}
                <th className="n">Tendência</th>
                <SortTh k="stock">Estoque</SortTh>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {sorted.map((r) => (
                  <motion.tr key={r.p.id} layout="position" className="click" onClick={() => setSelId(r.p.id)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ layout: { type: 'spring', stiffness: 500, damping: 40 } }}>
                    <td><span className={`rank ${rankOf[r.p.id] <= 3 ? 'top' : ''}`}>{rankOf[r.p.id]}</span></td>
                    <td>
                      <div className="cell-main">
                        <ProductArt art={r.p.art} cat={r.p.cat} size={36} radius={10} />
                        <div style={{ minWidth: 0 }}><strong title={r.p.name}>{r.p.name}</strong><small>{r.p.sku} · {brl(r.p.price)}</small></div>
                      </div>
                    </td>
                    <td className="n tnum"><strong>{brl(r.revenue)}</strong></td>
                    <td className="n tnum">{int(r.units)}</td>
                    <td className="n tnum">{r.units ? brl(r.ticket) : '—'}</td>
                    <td className="n">{r.prev ? <Delta value={r.delta} compact /> : <span className="muted">—</span>}</td>
                    <td className="n"><div className="share"><span className="tnum">{pct(r.share)}</span><span className="share-bar"><i style={{ width: `${Math.min(100, (r.share / Math.max(...filtered.map((x) => x.share), 0.0001)) * 100)}%` }} /></span></div></td>
                    <td className="n"><Sparkline values={sparkValues(r.p, range)} width={64} height={24} /></td>
                    <td className="n tnum">{r.p.stock < 30 ? <Badge tone="red">{r.p.stock}</Badge> : int(r.p.stock)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
            {sorted.length > 0 && (
              <tfoot>
                <tr>
                  <td /><td><strong>Total filtrado</strong></td>
                  <td className="n tnum"><strong>{brl(fTotal)}</strong></td>
                  <td className="n tnum"><strong>{int(fUnits)}</strong></td>
                  <td className="n tnum">{brl(ticket)}</td>
                  <td className="n">{fPrev ? <Delta value={(fTotal - fPrev) / fPrev} compact /> : null}</td>
                  <td className="n tnum">{pct(stats.total ? fTotal / stats.total : 0)}</td>
                  <td /><td />
                </tr>
              </tfoot>
            )}
          </table>
          {!sorted.length && <Empty title="Nenhum produto encontrado" text="Tente outra busca ou limpe o filtro de categoria." />}
        </div>
      </Card>

      <ProductDrawer row={sel} range={range} period={period} setPeriod={setPeriod} onClose={() => { setSelId(null); if (params.p) go('produtos', params.periodo ? { periodo: params.periodo } : undefined); }} />
      <NewProductModal open={newOpen} onClose={() => { setNewOpen(false); if (params.novo) go('produtos'); }} />
    </>
  );
}
