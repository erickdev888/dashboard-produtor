import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES, FUNNEL, PRODUCTS, REGIONS, periodRange, productStats, seriesFor } from '../data.js';
import { Button, Card, CardHead, Delta, Grid, PageHeader, Segmented, brl, brlK, ease, int, pct, useToast } from '../ui.jsx';
import { AreaChart, Donut, HBars, LegendRow } from '../charts.jsx';

const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DOWF = [0.86, 1.04, 1.03, 1.0, 1.02, 1.08, 0.93];
const HOURS = [0.6, 0.35, 0.2, 0.15, 0.15, 0.25, 0.55, 1.1, 1.8, 2.6, 3.1, 3.3, 3.6, 3.4, 3.2, 3.3, 3.5, 3.7, 3.9, 4.3, 4.8, 4.9, 3.9, 2.0];
// Rampa sequencial de um só tom (azul), do claro ao escuro
const RAMP = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95'];

function Heatmap({ total }) {
  const [hover, setHover] = useState(null);
  const cells = useMemo(() => {
    const sumW = DOWF.reduce((a, b) => a + b, 0) * HOURS.reduce((a, b) => a + b, 0);
    return DOW.map((_, d) => HOURS.map((h) => (total * DOWF[d] * h) / sumW));
  }, [total]);
  const max = Math.max(...cells.flat());
  return (
    <div>
      <div className="heat" onMouseLeave={() => setHover(null)}>
        {cells.map((row, d) => (
          <React.Fragment key={d}>
            <span className="heat-day">{DOW[d]}</span>
            {row.map((v, h) => {
              const k = Math.min(RAMP.length - 1, Math.floor((v / max) * RAMP.length));
              return (
                <motion.i key={h} className={hover && hover[0] === d && hover[1] === h ? 'on' : ''} style={{ background: RAMP[k] }}
                  initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (d * 24 + h) * 0.0025, duration: 0.3 }}
                  onMouseEnter={() => setHover([d, h, v])} />
              );
            })}
          </React.Fragment>
        ))}
        <span />
        {HOURS.map((_, h) => <span key={h} className="heat-hour">{h % 3 === 0 ? `${h}h` : ''}</span>)}
      </div>
      <div className="heat-foot">
        <span className="muted">{hover ? `${DOW[hover[0]]}, ${hover[1]}h–${hover[1] + 1}h: ${brlK(hover[2])} em média` : 'Passe o mouse para ver o faturamento médio de cada hora'}</span>
        <span className="heat-scale">menos {RAMP.filter((_, i) => i % 2 === 0).map((c) => <i key={c} style={{ background: c }} />)} mais</span>
      </div>
    </div>
  );
}

export default function Reports() {
  const [period, setPeriod] = useState('90d');
  const toast = useToast();
  const range = useMemo(() => periodRange(period), [period]);
  const stats = useMemo(() => productStats(range), [range]);
  const series = useMemo(() => seriesFor(range), [range]);
  const cats = CATEGORIES.map((c, i) => {
    const rows = stats.rows.filter((r) => r.p.cat === c.id);
    const v = rows.reduce((s, r) => s + r.revenue, 0), pv = rows.reduce((s, r) => s + r.prev, 0);
    return { ...c, index: i, value: v, delta: pv ? (v - pv) / pv : 0 };
  }).sort((a, b) => b.delta - a.delta);
  const channels = ['Site', 'App', 'Marketplace'].map((ch, i) => ({ label: ch, index: i, value: stats.rows.reduce((s, r) => s + r.revenue * r.p.channels[ch], 0) }));
  const days = range.len;
  return (
    <>
      <PageHeader title="Relatórios" subtitle={`Desempenho de vendas · ${range.label}`}>
        <Segmented value={period} onChange={setPeriod} options={[{ id: '30d', label: '30 dias' }, { id: '90d', label: '90 dias' }, { id: 'ano', label: 'Este ano' }, { id: '12m', label: '12 meses' }]} />
        <Button icon="download" variant="primary" onClick={() => toast('Relatório em PDF gerado (demonstração)', { icon: 'file' })}>Baixar PDF</Button>
      </PageHeader>

      <Grid className="grid g-main">
        <Card>
          <CardHead title="Faturamento" subtitle={`${brl(stats.total)} · ${int(stats.units)} unidades · média de ${brlK(stats.total / days)} por dia`}>
            <LegendRow items={[{ label: 'Período atual', color: 'var(--s1)' }, { label: 'Período anterior', color: 'var(--ink-3)', dashed: true }]} />
            <Delta value={(stats.total - stats.prevTotal) / stats.prevTotal} />
          </CardHead>
          <AreaChart points={series.points} height={270} />
        </Card>
        <Card>
          <CardHead title="Funil de conversão" subtitle="Últimos 30 dias · loja e app" />
          {FUNNEL.map((f, i) => (
            <div className="funnel-row" key={f.label}>
              <span>{f.label}<small>{i > 0 ? `${pct(f.value / FUNNEL[i - 1].value, 0)} da etapa anterior` : 'base do funil'}</small></span>
              <div className="funnel-bar">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(2, (f.value / FUNNEL[0].value) * 100)}%` }} transition={{ duration: 1, ease, delay: 0.15 + i * 0.1 }} />
              </div>
              <b>{f.value >= 1e6 ? `${(f.value / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi` : int(f.value)}</b>
            </div>
          ))}
          <div className="mini-boxes">
            <div className="mini-box"><strong>{pct(FUNNEL[4].value / FUNNEL[0].value)}</strong><span>Conversão</span></div>
            <div className="mini-box"><strong>{pct(1 - FUNNEL[3].value / FUNNEL[2].value, 0)}</strong><span>Abandono de carrinho</span></div>
            <div className="mini-box"><strong>{pct(FUNNEL[4].value / FUNNEL[3].value, 0)}</strong><span>Checkout pago</span></div>
          </div>
        </Card>
      </Grid>

      <Grid className="grid g-3">
        <Card>
          <CardHead title="Vendas por estado" subtitle="Participação no faturamento do período" />
          <HBars rows={REGIONS.slice(0, 8).map((r) => ({ label: r.uf, value: stats.total * r.share, sub: pct(r.share) }))} />
        </Card>
        <Card>
          <CardHead title="Canais de venda" subtitle="Site, app e marketplaces parceiros" />
          <div style={{ display: 'grid', placeItems: 'center', marginBottom: 10 }}><Donut data={channels} size={170} centerLabel="no período" /></div>
          <div className="donut-legend">
            {channels.map((c) => <div key={c.label} className="dl-row"><i style={{ background: `var(--s${c.index + 1})` }} /><span>{c.label}</span><b>{pct(c.value / stats.total, 0)}</b></div>)}
          </div>
        </Card>
        <Card>
          <CardHead title="Categorias" subtitle="Variação vs. período anterior" />
          <div className="list">
            {cats.map((c, i) => (
              <motion.div className="list-row" key={c.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }} style={{ padding: '8px 0' }}>
                <i style={{ width: 10, height: 10, borderRadius: 3, background: `var(--s${c.index + 1})`, flex: 'none' }} />
                <div className="grow"><strong>{c.name}</strong><small>{brlK(c.value)} · {PRODUCTS.filter((p) => p.cat === c.id).length} produtos</small></div>
                <Delta value={c.delta} compact />
              </motion.div>
            ))}
          </div>
        </Card>
      </Grid>

      <Card style={{ marginBottom: 0 }}>
        <CardHead title="Quando a loja vende" subtitle="Faturamento médio por dia da semana e hora (horário de Brasília)" />
        <Heatmap total={stats.total / Math.max(1, days / 7)} />
      </Card>
    </>
  );
}
