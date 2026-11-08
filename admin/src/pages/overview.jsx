import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ADMIN, CATEGORIES, LAST, NOW, PRODUCTS, TODAY, categoryTotals, dayFraction, idxOf, monthly, sumRev, sumUnits } from '../data.js';
import { Badge, Button, Card, CardHead, Grid, PageHeader, ProductArt, Segmented, Stat, ago, brl, brlK, int, pct } from '../ui.jsx';
import { BarChart, Donut, HBars } from '../charts.jsx';
import { go, useStore } from '../store.jsx';
import { ORDER_STATUS } from '../data.js';

const greeting = () => { const h = NOW.getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

export default function Overview() {
  const { badges, orders } = useStore();
  const [months, setMonths] = useState(6);
  const [cat, setCat] = useState(null);

  const catProducts = cat == null ? PRODUCTS : PRODUCTS.filter((p) => p.cat === CATEGORIES[cat].id);
  const bars = useMemo(() => monthly(months, catProducts), [months, cat]);
  const start = idxOf(new Date(TODAY.getFullYear(), TODAY.getMonth() - months + 1, 1));
  const cats = useMemo(() => categoryTotals(start, LAST), [months]);
  const total = bars.reduce((s, b) => s + b.value, 0);
  const units = bars.reduce((s, b) => s + b.units, 0);

  // Indicadores do dia e do mês
  const today = PRODUCTS.reduce((s, p) => s + p.units[LAST], 0);
  const yestSame = PRODUCTS.reduce((s, p) => s + p.units[LAST - 1], 0) * dayFraction;
  const mStart = idxOf(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const mtd = PRODUCTS.reduce((s, p) => s + sumRev(p, mStart, LAST), 0);
  const pmStart = idxOf(new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1));
  const pmtd = PRODUCTS.reduce((s, p) => s + sumRev(p, pmStart, pmStart + (LAST - mStart)), 0);
  const topToday = [...PRODUCTS].map((p) => ({ p, v: sumRev(p, LAST, LAST), u: sumUnits(p, LAST, LAST) })).sort((a, b) => b.v - a.v).slice(0, 5);
  const attention = badges.pedidos + badges.moderacao + badges.atendimento + badges.financeiro;
  const dateStr = TODAY.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <PageHeader title={`${greeting()}, ${ADMIN.first}`} subtitle={`${dateStr[0].toUpperCase() + dateStr.slice(1)} · ${attention} itens precisam da sua atenção`}>
        <Button icon="history" onClick={() => go('atividade')}>Log de atividades</Button>
        <Button icon="plus" variant="primary" onClick={() => go('produtos', { novo: 1 })}>Novo produto</Button>
      </PageHeader>

      <Grid className="grid g-main">
        <Card>
          <CardHead title={cat == null ? 'Faturamento da loja' : `Faturamento · ${CATEGORIES[cat].name}`} subtitle={`${brl(total)} com ${int(units)} unidades nos últimos ${months} meses`}>
            <Segmented value={months} onChange={setMonths} options={[{ id: 3, label: '3 meses' }, { id: 6, label: '6 meses' }, { id: 12, label: '12 meses' }]} />
            <Button size="sm" variant="primary" icon="box" onClick={() => go('produtos')}>Por produto</Button>
          </CardHead>
          <BarChart data={bars} height={250} accentLast extra={(d) => <>
            <span className="tip-row">{int(d.units)} unidades</span>
            <span className="tip-row muted">Margem bruta {brlK(d.margin)}</span>
          </>} />
        </Card>
        <Card>
          <CardHead title="Faturamento por categoria" subtitle={`Últimos ${months} meses. Clique para filtrar.`} />
          <div className="donut-wrap" style={{ flexDirection: 'column' }}>
            <Donut data={cats} size={176} centerLabel="faturamento" selected={cat} onSelect={setCat} />
            <div className="donut-legend" style={{ width: '100%', gap: 0 }}>
              {cats.map((c, i) => (
                <button key={c.id} className={`dl-row ${cat === i ? 'on' : ''}`} onClick={() => setCat(cat === i ? null : i)}>
                  <i style={{ background: `var(--s${i + 1})` }} /><span>{c.label}</span><b>{brlK(c.value)}</b>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </Grid>

      <Grid className="grid g-4">
        <Stat icon="cart" label="Pedidos hoje" value={today / 1.18} sub={`até ${NOW.getHours()}h · vs. ontem no mesmo horário`} delta={(today - yestSame) / yestSame} onClick={() => go('pedidos')} />
        <Stat icon="package" tone="amber" label="Aguardando separação" value={badges.pedidos} sub="pagos e prontos para o CD" onClick={() => go('pedidos')} />
        <Stat icon="box" tone="violet" label="SKUs ativos" value={3482} sub={`${PRODUCTS.filter((p) => p.stock < 30).length} com estoque baixo`} onClick={() => go('produtos')} />
        <Stat icon="dollar" tone="green" label="Faturamento do mês" value={mtd} format={brlK} delta={(mtd - pmtd) / pmtd} sub="vs. mesmo período do mês anterior" onClick={() => go('financeiro')} />
        <Stat icon="team" label="Novos clientes" value={1284} delta={0.124} sub="últimos 7 dias vs. 7 anteriores" onClick={() => go('clientes')} />
        <Stat icon="percent" tone="violet" label="Taxa de conversão" value={1.8} format={(v) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`} sub="33.120 pedidos de 1,84 mi visitas" onClick={() => go('relatorios')} />
        <Stat icon="support" tone="red" label="Tickets abertos" value={badges.atendimento} sub="1º atendimento em 14 min" onClick={() => go('atendimento')} />
        <Stat icon="server" tone="green" label="Disponibilidade" value={99.97} format={(v) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`} sub="loja e checkout · 30 dias" onClick={() => go('sistema')} />
      </Grid>

      <Grid className="grid g-side" style={{ marginBottom: 0 }}>
        <Card>
          <CardHead title="Mais vendidos hoje" subtitle={`Faturamento até ${NOW.getHours()}h`}>
            <button className="link" onClick={() => go('produtos', { periodo: 'hoje' })}>Ver todos</button>
          </CardHead>
          <HBars
            rows={topToday.map(({ p, v, u }) => ({ key: p.id, label: p.name, value: v, sub: `${int(u)} un. · ${brl(p.price)}`, lead: <ProductArt art={p.art} cat={p.cat} size={26} radius={8} />, color: `var(--s${CATEGORIES.findIndex((c) => c.id === p.cat) + 1})` }))}
            onSelect={(r) => go('produtos', { p: r.key, periodo: 'hoje' })}
          />
        </Card>
        <Card className="flush">
          <CardHead title="Últimos pedidos" subtitle="Atualizado em tempo real">
            <button className="link" onClick={() => go('pedidos')} style={{ marginRight: 4 }}>Ver pedidos</button>
          </CardHead>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Pedido</th><th>Cliente</th><th>Status</th><th className="n">Total</th></tr></thead>
              <tbody>
                {orders.slice(0, 7).map((o, i) => (
                  <motion.tr key={o.id} className="click" onClick={() => go('pedidos', { o: o.id.slice(1) })} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.04 }}>
                    <td><strong>{o.id}</strong><div className="muted" style={{ fontSize: 11.5 }}>{ago((NOW - o.date) / 60000)}</div></td>
                    <td>{o.customer.name}<div className="muted" style={{ fontSize: 11.5 }}>{o.items[0].p.name.slice(0, 34)}{o.items.length > 1 ? ` +${o.items.length - 1}` : ''}</div></td>
                    <td><Badge tone={ORDER_STATUS[o.status].tone} dot>{ORDER_STATUS[o.status].label}</Badge></td>
                    <td className="n tnum"><strong>{brl(o.total)}</strong></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Grid>
    </>
  );
}
