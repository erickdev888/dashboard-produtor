import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { INVOICES, LAST, PRODUCTS, TODAY, idxOf, monthly, sumRev } from '../data.js';
import { Avatar, Badge, Button, Card, CardHead, Empty, Grid, Icon, Modal, PageHeader, Progress, Segmented, Stat, brl, brlK, downloadCSV, fmtDate, int, pct, spring, useToast } from '../ui.jsx';
import { BarChart, Donut, Ring } from '../charts.jsx';
import { useStore } from '../store.jsx';

const monthName = TODAY.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export function Finance() {
  const { payouts, setPayouts } = useStore();
  const toast = useToast();
  const [metric, setMetric] = useState('value');
  const [tab, setTab] = useState('aberto');
  const [confirm, setConfirm] = useState(false);
  const months = useMemo(() => monthly(8), []);

  const mStart = idxOf(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const own = PRODUCTS.filter((p) => p.seller === 'Vitrine Oficial');
  const mkt = PRODUCTS.filter((p) => p.seller !== 'Vitrine Oficial');
  const ownRev = own.reduce((s, p) => s + sumRev(p, mStart, LAST), 0);
  const mktRev = mkt.reduce((s, p) => s + sumRev(p, mStart, LAST), 0);
  const gmv = ownRev + mktRev;
  const fees = gmv * 0.021 + mktRev * 0.0;
  const commission = mktRev * 0.145;
  const storeKeeps = ownRev - fees + commission;
  const sellersKeep = mktRev - commission;
  const margin = months[months.length - 1].margin;

  const open = payouts.filter((p) => p.status !== 'pago');
  const overdue = payouts.filter((p) => p.status === 'vencido');
  const paidMonth = payouts.filter((p) => p.status === 'pago');
  const list = payouts.filter((p) => (tab === 'todos' ? true : tab === 'aberto' ? p.status === 'pendente' : p.status === tab));

  const pay = (ids) => {
    setPayouts((l) => l.map((p) => (ids.includes(p.id) ? { ...p, status: 'pago', due: new Date() } : p)));
    const total = payouts.filter((p) => ids.includes(p.id)).reduce((s, p) => s + p.net, 0);
    toast(`${ids.length} ${ids.length > 1 ? 'repasses pagos' : 'repasse pago'} via Pix · ${brl(total)}`, { icon: 'pix' });
  };

  const payments = [
    { label: 'Cartão de crédito', value: gmv * 0.49, index: 0, fee: '2,9% + antifraude' },
    { label: 'Pix', value: gmv * 0.41, index: 2, fee: '0,99%' },
    { label: 'Boleto', value: gmv * 0.1, index: 3, fee: 'R$ 2,49 por boleto' },
  ];

  return (
    <>
      <PageHeader title="Financeiro" subtitle={`Receita, repasses a sellers e taxas · ${monthName}`}>
        <Button icon="download" onClick={() => { downloadCSV('repasses.csv', ['Repasse', 'Seller', 'Pedidos', 'Bruto', 'Comissão', 'Líquido', 'Vencimento', 'Status'], payouts.map((p) => [p.id, p.seller, p.orders, p.gross.toFixed(2).replace('.', ','), p.fee.toFixed(2).replace('.', ','), p.net.toFixed(2).replace('.', ','), p.due.toLocaleDateString('pt-BR'), p.status])); toast('Repasses exportados em CSV', { icon: 'download' }); }}>Exportar CSV</Button>
        <Button icon="dollar" variant="primary" disabled={!open.length} onClick={() => setConfirm(true)}>Pagar todos em aberto</Button>
      </PageHeader>

      <Grid className="grid g-4">
        <Stat icon="dollar" tone="green" label="Receita bruta do mês (GMV)" value={gmv} format={brlK} sub={`${brlK(ownRev)} próprios · ${brlK(mktRev)} marketplace`} delta={0.052} />
        <Stat icon="clock" tone="amber" label="A repassar a sellers" value={open.reduce((s, p) => s + p.net, 0)} format={brlK} sub={`${open.length} em aberto · ${overdue.length} vencido${overdue.length === 1 ? '' : 's'}`} />
        <Stat icon="check" tone="blue" label="Repassado no mês" value={paidMonth.reduce((s, p) => s + p.net, 0)} format={brlK} sub={`${paidMonth.length} pagamentos via Pix`} />
        <Stat icon="percent" tone="violet" label="Margem bruta" value={margin} format={brlK} sub={`${pct(margin / months[months.length - 1].value)} da receita do mês`} delta={-0.008} />
      </Grid>

      <Grid className="grid g-main">
        <Card>
          <CardHead title={metric === 'value' ? 'Receita por mês' : 'Margem bruta por mês'} subtitle="Últimos 8 meses · mês atual parcial">
            <Segmented value={metric} onChange={setMetric} options={[{ id: 'value', label: 'Receita' }, { id: 'margin', label: 'Margem' }]} />
          </CardHead>
          <BarChart data={months} valueKey={metric} height={250} accentLast extra={(d) => <span className="tip-row">{metric === 'value' ? `Margem ${brlK(d.margin)} (${pct(d.margin / d.value)})` : `Receita ${brlK(d.value)}`}</span>} />
        </Card>
        <Card>
          <CardHead title="Quem fica com o quê" subtitle="Divisão do faturamento deste mês" />
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <Ring value={storeKeeps / gmv} size={168} label={pct(storeKeeps / gmv, 0)} sub="fica com a loja" />
          </div>
          <div className="mini-boxes">
            <div className="mini-box"><strong>{brlK(storeKeeps)}</strong><span>Loja</span></div>
            <div className="mini-box"><strong>{brlK(sellersKeep)}</strong><span>Sellers</span></div>
            <div className="mini-box"><strong>{brlK(fees)}</strong><span>Taxas</span></div>
          </div>
        </Card>
      </Grid>

      <Grid className="grid g-side" style={{ marginBottom: 0 }}>
        <Card>
          <CardHead title="Formas de pagamento" subtitle="Participação no faturamento do mês" />
          <div className="donut-wrap">
            <Donut data={payments} size={160} thickness={18} centerLabel="no mês" />
            <div className="donut-legend">
              {payments.map((p) => (
                <div key={p.label} className="dl-row" style={{ gridTemplateColumns: '10px 1fr auto' }}>
                  <i style={{ background: `var(--s${p.index + 1})` }} />
                  <span>{p.label}<small style={{ display: 'block', color: 'var(--ink-3)', fontSize: 11 }}>{p.fee}</small></span>
                  <b>{pct(p.value / gmv, 0)}</b>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card className="flush">
          <div className="card-head">
            <div><h3>Repasses a sellers</h3><p>Valor líquido após comissão de 14,5%</p></div>
            <Segmented value={tab} onChange={setTab} options={[{ id: 'aberto', label: 'A vencer', count: payouts.filter((p) => p.status === 'pendente').length }, { id: 'vencido', label: 'Vencidos', count: overdue.length }, { id: 'pago', label: 'Pagos', count: paidMonth.length }, { id: 'todos', label: 'Todos' }]} />
          </div>
          <div className="table-wrap scroll">
            <table className="table">
              <thead><tr><th>Seller</th><th className="n">Bruto</th><th className="n">Líquido</th><th>Vencimento</th><th className="n" /></tr></thead>
              <tbody>
                <AnimatePresence mode="popLayout" initial={false}>
                  {list.map((p) => (
                    <motion.tr key={p.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30, transition: { duration: 0.25 } }} transition={spring}>
                      <td><div className="cell-main"><Avatar name={p.seller} size={30} /><div><strong>{p.seller}</strong><small>{p.id} · {p.orders} pedidos</small></div></div></td>
                      <td className="n tnum muted">{brl(p.gross)}</td>
                      <td className="n tnum"><strong>{brl(p.net)}</strong></td>
                      <td>{p.status === 'pago' ? <Badge tone="green" icon="check">Pago {fmtDate(p.due)}</Badge> : p.status === 'vencido' ? <Badge tone="red" icon="alert">Venceu {fmtDate(p.due)}</Badge> : <Badge tone="amber" dot>{fmtDate(p.due)}</Badge>}</td>
                      <td className="n">{p.status !== 'pago' && <Button size="sm" variant="primary" onClick={() => pay([p.id])}>Pagar</Button>}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {!list.length && <Empty icon="checkCircle" title="Tudo em dia" text="Nenhum repasse nesta aba." />}
          </div>
        </Card>
      </Grid>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Pagar repasses em aberto" subtitle="Os valores serão enviados via Pix para a conta cadastrada de cada seller."
        footer={<><Button variant="ghost" onClick={() => setConfirm(false)}>Cancelar</Button><Button variant="primary" icon="pix" onClick={() => { pay(open.map((p) => p.id)); setConfirm(false); }}>Pagar {brl(open.reduce((s, p) => s + p.net, 0))}</Button></>}>
        <div className="list">
          {open.map((p) => (
            <div className="list-row" key={p.id}>
              <Avatar name={p.seller} size={32} />
              <div className="grow"><strong>{p.seller}</strong><small>{p.id} · vence {fmtDate(p.due)}</small></div>
              <strong className="tnum">{brl(p.net)}</strong>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}

export function Billing() {
  const toast = useToast();
  return (
    <>
      <PageHeader title="Cobrança" subtitle="Plano da plataforma, uso e faturas">
        <Button icon="download" onClick={() => toast('Todas as faturas baixadas (demonstração)', { icon: 'download' })}>Baixar faturas</Button>
        <Button icon="zap" variant="primary" onClick={() => toast('Fale com o time comercial para o plano Enterprise', { icon: 'mail', tone: 'blue' })}>Fazer upgrade</Button>
      </PageHeader>
      <Grid className="grid g-3">
        <Card>
          <CardHead title="Plano Business" subtitle="Renovação mensal · próxima cobrança em 05/12" />
          <div style={{ font: '700 30px var(--font-display)', letterSpacing: '-0.03em' }}>R$ 2.300<span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500 }}> / mês</span></div>
          <div style={{ margin: '16px 0 8px', display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span>Assentos</span><b>13 de 20</b></div>
          <Progress value={13 / 20} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
            {['Marketplace', 'Multi-CD', 'API ilimitada', 'Suporte 24/7'].map((f) => <Badge key={f} tone="blue" icon="check">{f}</Badge>)}
          </div>
        </Card>
        <Card>
          <CardHead title="Uso no ciclo" subtitle="Reinicia em 05/12" />
          {[['Pedidos processados', 41230, 60000], ['Chamadas de API', 8.2e6, 10e6], ['Armazenamento de imagens', 182, 250], ['E-mails transacionais', 212000, 500000]].map(([l, v, max], i) => (
            <div key={l} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}><span>{l}</span><b className="tnum">{l.includes('Armazenamento') ? `${v} de ${max} GB` : `${int(v)} de ${int(max)}`}</b></div>
              <Progress value={v / max} tone={v / max > 0.8 ? 'amber' : 'blue'} delay={0.1 * i} />
            </div>
          ))}
        </Card>
        <Card>
          <CardHead title="Forma de pagamento" subtitle="Cobrança automática" />
          <motion.div className="pay-card" whileHover={{ rotateX: 6, rotateY: -8, scale: 1.02 }} transition={spring}>
            <span className="pay-chip" />
            <div className="pay-num">•••• •••• •••• 4421</div>
            <div className="pay-foot"><span>VITRINE COMÉRCIO LTDA</span><span>08/28</span></div>
          </motion.div>
          <Button className="btn-block" style={{ marginTop: 14 }} icon="card" onClick={() => toast('Cartão atualizado (demonstração)', { icon: 'card' })}>Trocar cartão</Button>
        </Card>
      </Grid>
      <Card className="flush">
        <div className="card-head"><div><h3>Faturas</h3><p>Últimos 8 meses</p></div></div>
        <div className="table-wrap scroll">
          <table className="table">
            <thead><tr><th>Fatura</th><th>Emissão</th><th>Plano</th><th>Status</th><th className="n">Valor</th><th className="n" /></tr></thead>
            <tbody>
              {INVOICES.map((inv, i) => (
                <motion.tr key={inv.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.04 }}>
                  <td><div className="cell-main"><span className="palette-icon"><Icon name="file" size={14} /></span><strong>{inv.id}</strong></div></td>
                  <td>{fmtDate(inv.date, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="muted">{inv.plan}</td>
                  <td>{inv.status === 'paga' ? <Badge tone="green" icon="check">Paga</Badge> : <Badge tone="amber" dot>Em aberto</Badge>}</td>
                  <td className="n tnum"><strong>{brl(inv.amount)}</strong></td>
                  <td className="n"><Button size="sm" variant="ghost" icon="download" onClick={() => toast(`${inv.id}.pdf baixado (demonstração)`, { icon: 'download' })}>PDF</Button></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
