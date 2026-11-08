import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NOW, ORDER_STATUS } from '../data.js';
import { Avatar, Badge, Button, Card, Drawer, Empty, Grid, Icon, PageHeader, Pagination, ProductArt, SearchField, Segmented, Stat, ago, brl, brlK, downloadCSV, fmtDate, fmtTime, int, useToast } from '../ui.jsx';
import { go, useStore } from '../store.jsx';

const FLOW = ['aguardando', 'pago', 'separacao', 'enviado', 'entregue'];
const NEXT = { aguardando: 'pago', pago: 'separacao', separacao: 'enviado', enviado: 'entregue' };
const NEXT_LABEL = { pago: 'Iniciar separação', separacao: 'Marcar como enviado', enviado: 'Confirmar entrega', aguardando: 'Confirmar pagamento' };
const PER = 12;

function OrderDrawer({ order, onClose }) {
  const { setOrders } = useStore();
  const toast = useToast();
  if (!order) return <Drawer open={false} onClose={onClose} />;
  const step = FLOW.indexOf(order.status);
  const advance = () => {
    const to = NEXT[order.status];
    setOrders((l) => l.map((o) => (o.id === order.id ? { ...o, status: to } : o)));
    toast(`Pedido ${order.id}: ${ORDER_STATUS[to].label.toLowerCase()}`, { icon: 'truck' });
  };
  const cancel = () => {
    setOrders((l) => l.map((o) => (o.id === order.id ? { ...o, status: 'cancelado' } : o)));
    toast(`Pedido ${order.id} cancelado e estorno solicitado`, { tone: 'red', icon: 'x' });
  };
  return (
    <Drawer open onClose={onClose} title={`Pedido ${order.id}`} subtitle={`${fmtDate(order.date, { day: '2-digit', month: 'long' })} às ${fmtTime(order.date)} · ${order.channel}`}>
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <Badge tone={ORDER_STATUS[order.status].tone} dot>{ORDER_STATUS[order.status].label}</Badge>
        <Badge tone="gray" icon={order.payment === 'Pix' ? 'pix' : order.payment === 'Boleto' ? 'barcode' : 'card'}>{order.payment}{order.installments > 1 ? ` · ${order.installments}x` : ''}</Badge>
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
        <div className="section-title">Itens</div>
        <div className="order-items">
          {order.items.map((it, i) => (
            <div className="order-item" key={i}>
              <ProductArt art={it.p.art} cat={it.p.cat} size={42} />
              <div className="grow"><strong>{it.p.name}</strong><small>{it.p.sku} · {it.qty} × {brl(it.p.price)}</small></div>
              <strong className="tnum">{brl(it.p.price * it.qty)}</strong>
            </div>
          ))}
        </div>
        <div className="totals" style={{ marginTop: 14 }}>
          <div><span>Subtotal</span><span className="tnum">{brl(order.subtotal)}</span></div>
          <div><span>Frete</span><span className="tnum">{order.shipping ? brl(order.shipping) : 'Grátis'}</span></div>
          <div className="total"><span>Total</span><span className="tnum">{brl(order.total)}</span></div>
        </div>
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
        <div className="section-title">Cliente</div>
        <div className="list-row" style={{ borderBottom: 0 }}>
          <Avatar name={order.customer.name} size={40} />
          <div className="grow"><strong>{order.customer.name}</strong><small>{order.customer.email} · {order.customer.city}, {order.customer.uf}</small></div>
          <Badge tone="violet">{order.customer.tier}</Badge>
        </div>
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
        <div className="section-title">Andamento</div>
        <div className="steps">
          {FLOW.map((s, i) => (
            <motion.div key={s} className={`step ${order.status !== 'cancelado' && i <= step ? 'on' : ''}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}>
              <span className="step-dot">{order.status !== 'cancelado' && i <= step ? <Icon name="check" size={13} stroke={3} /> : <i style={{ width: 6, height: 6, borderRadius: 9, background: 'currentColor' }} />}</span>
              <div><strong>{ORDER_STATUS[s].label}</strong><small>{i <= step && order.status !== 'cancelado' ? (i === step ? 'Etapa atual' : 'Concluído') : 'Pendente'}</small></div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        {NEXT[order.status] && <Button variant="primary" icon="arrowRight" onClick={advance}>{NEXT_LABEL[order.status]}</Button>}
        {!['cancelado', 'entregue'].includes(order.status) && <Button variant="danger" icon="x" onClick={cancel}>Cancelar pedido</Button>}
        <Button variant="ghost" icon="support" onClick={() => go('atendimento')}>Abrir ticket</Button>
      </motion.div>
    </Drawer>
  );
}

export default function Orders({ params }) {
  const { orders } = useStore();
  const [tab, setTab] = useState('todos');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [selId, setSelId] = useState(params.o ? '#' + params.o : null);
  const toast = useToast();
  useEffect(() => { if (params.o) setSelId('#' + params.o); }, [params.o]);
  useEffect(() => setPage(0), [tab, q]);

  const counts = useMemo(() => Object.fromEntries(Object.keys(ORDER_STATUS).map((k) => [k, orders.filter((o) => o.status === k).length])), [orders]);
  const list = orders.filter((o) => (tab === 'todos' || o.status === tab) && (!q || o.id.includes(q) || o.customer.name.toLowerCase().includes(q.toLowerCase()) || o.items.some((it) => it.p.name.toLowerCase().includes(q.toLowerCase()))));
  const pages = Math.ceil(list.length / PER);
  const rows = list.slice(page * PER, page * PER + PER);
  const last24 = orders.filter((o) => NOW - o.date < 864e5 && o.status !== 'cancelado');
  const sel = orders.find((o) => o.id === selId);

  return (
    <>
      <PageHeader title="Pedidos" subtitle={`${int(orders.length)} pedidos recentes · atualizado às ${fmtTime(NOW)}`}>
        <Button icon="download" onClick={() => { downloadCSV('pedidos.csv', ['Pedido', 'Data', 'Cliente', 'Itens', 'Pagamento', 'Status', 'Total'], list.map((o) => [o.id, o.date.toLocaleString('pt-BR'), o.customer.name, o.items.map((i) => `${i.qty}x ${i.p.name}`).join(' | '), o.payment, ORDER_STATUS[o.status].label, o.total.toFixed(2).replace('.', ',')])); toast(`${list.length} pedidos exportados`, { icon: 'download' }); }}>Exportar</Button>
        <Button icon="truck" variant="primary" onClick={() => toast(`${counts.separacao} etiquetas de envio geradas`, { icon: 'truck' })}>Gerar etiquetas</Button>
      </PageHeader>

      <Grid className="grid g-4">
        <Stat icon="cart" label="Pedidos nas últimas 24 h" value={last24.length} sub="na amostra recente" />
        <Stat icon="dollar" tone="green" label="Valor nas últimas 24 h" value={last24.reduce((s, o) => s + o.total, 0)} format={brlK} sub={`ticket médio ${brl(last24.reduce((s, o) => s + o.total, 0) / Math.max(1, last24.length))}`} />
        <Stat icon="package" tone="amber" label="Para separar" value={counts.pago + counts.separacao} sub={`${counts.pago} pagos · ${counts.separacao} em separação`} />
        <Stat icon="truck" tone="violet" label="Em trânsito" value={counts.enviado} sub={`${counts.entregue} entregues na amostra`} />
      </Grid>

      <Card className="flush">
        <div className="card-head">
          <Segmented value={tab} onChange={setTab} options={[{ id: 'todos', label: 'Todos', count: orders.length }, ...['pago', 'separacao', 'enviado', 'entregue', 'aguardando', 'cancelado'].map((k) => ({ id: k, label: ORDER_STATUS[k].label.replace('Aguardando pagamento', 'Aguardando'), count: counts[k] }))]} />
          <SearchField value={q} onChange={setQ} placeholder="Pedido, cliente ou produto" />
        </div>
        <div className="table-wrap scroll">
          <table className="table">
            <thead><tr><th>Pedido</th><th>Cliente</th><th>Produtos</th><th>Pagamento</th><th>Status</th><th className="n">Total</th></tr></thead>
            <tbody>
              <AnimatePresence mode="popLayout" initial={false}>
                {rows.map((o, i) => (
                  <motion.tr key={o.id} className="click" onClick={() => setSelId(o.id)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}>
                    <td><strong>{o.id}</strong><div className="muted" style={{ fontSize: 11.5 }}>{fmtDate(o.date)} · {fmtTime(o.date)}</div></td>
                    <td><div className="cell-main"><Avatar name={o.customer.name} size={30} /><div><strong>{o.customer.name}</strong><small>{o.customer.city} · {o.customer.uf}</small></div></div></td>
                    <td><div className="cell-main">{o.items.slice(0, 3).map((it, k) => <ProductArt key={k} art={it.p.art} cat={it.p.cat} size={28} radius={8} className={k ? 'stacked' : ''} />)}<small style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.items[0].p.name}{o.items.length > 1 ? ` +${o.items.length - 1}` : ''}</small></div></td>
                    <td className="muted">{o.payment}{o.installments > 1 ? ` · ${o.installments}x` : ''}</td>
                    <td><Badge tone={ORDER_STATUS[o.status].tone} dot>{ORDER_STATUS[o.status].label}</Badge></td>
                    <td className="n tnum"><strong>{brl(o.total)}</strong><div className="muted" style={{ fontSize: 11.5 }}>{ago((NOW - o.date) / 60000)}</div></td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {!rows.length && <Empty icon="cart" title="Nenhum pedido aqui" text="Mude o filtro de status ou a busca." />}
        </div>
        <Pagination page={page} pages={pages} onChange={setPage} />
      </Card>
      <OrderDrawer order={sel} onClose={() => { setSelId(null); if (params.o) go('pedidos'); }} />
    </>
  );
}
