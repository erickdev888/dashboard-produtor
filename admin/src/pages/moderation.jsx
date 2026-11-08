import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { catById } from '../data.js';
import { Avatar, Badge, Button, Empty, Icon, Modal, PageHeader, ProductArt, Segmented, brl, rise, spring, useToast } from '../ui.jsx';
import { useStore } from '../store.jsx';

const CHECK_TONE = { ok: 'green', warn: 'amber', bad: 'red' };
const CHECK_ICON = { ok: 'check', warn: 'alert', bad: 'x' };
const REASONS = ['Fotos insuficientes', 'Sem nota fiscal', 'Preço fora da política', 'Descrição incompleta', 'Produto proibido'];

export default function Moderation() {
  const { listings, setListings } = useStore();
  const [tab, setTab] = useState('review');
  const [review, setReview] = useState(null);
  const [reason, setReason] = useState(REASONS[0]);
  const toast = useToast();
  const list = listings.filter((l) => l.state === tab);
  const count = (s) => listings.filter((l) => l.state === s).length;
  const setState = (l, state) => {
    setListings((all) => all.map((x) => (x.id === l.id ? { ...x, state } : x)));
    toast(state === 'approved' ? `Anúncio aprovado e publicado: ${l.title}` : `Anúncio devolvido ao seller: ${reason.toLowerCase()}`, {
      tone: state === 'approved' ? 'green' : 'red', icon: state === 'approved' ? 'checkCircle' : 'undo',
      action: { label: 'Desfazer', run: () => setListings((all) => all.map((x) => (x.id === l.id ? { ...x, state: 'review' } : x))) },
    });
    setReview(null);
  };
  return (
    <>
      <PageHeader title="Moderação" subtitle="Anúncios de sellers do marketplace aguardando aprovação">
        <Button icon="check" variant="primary" disabled={!list.filter((l) => l.checks.every(([t]) => t === 'ok')).length || tab !== 'review'}
          onClick={() => { const ok = list.filter((l) => l.checks.every(([t]) => t === 'ok')); setListings((all) => all.map((x) => (ok.some((o) => o.id === x.id) ? { ...x, state: 'approved' } : x))); toast(`${ok.length} anúncios sem pendências aprovados`, { icon: 'checkCircle' }); }}>
          Aprovar os sem pendências
        </Button>
      </PageHeader>
      <motion.div variants={rise} style={{ marginBottom: 16 }}>
        <Segmented value={tab} onChange={setTab} options={[{ id: 'review', label: 'Em análise', count: count('review') }, { id: 'approved', label: 'Aprovados', count: count('approved') }, { id: 'rejected', label: 'Devolvidos', count: count('rejected') }]} />
      </motion.div>
      <motion.div className="listing-grid" layout>
        <AnimatePresence mode="popLayout">
          {list.map((l, i) => (
            <motion.article key={l.id} layout className="card listing"
              initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.85, y: -10, filter: 'blur(8px)', transition: { duration: 0.3 } }}
              transition={{ ...spring, delay: i * 0.04 }} whileHover={{ y: -4 }}>
              <div className="listing-img">
                <ProductArt art={l.art} cat={l.cat} size={200} />
                <span className="li-chip tl"><i />{tab === 'review' ? 'Em análise' : tab === 'approved' ? 'Publicado' : 'Devolvido'}</span>
                <span className="li-chip tr"><Icon name="image" size={11} />{l.photos}</span>
                <span className="li-chip bl">{l.type} · {catById[l.cat].name}</span>
              </div>
              <div className="listing-body">
                <div className="listing-price">{brl(l.price)}</div>
                <div className="listing-title">{l.title}</div>
                <div className="seller-row">
                  <Avatar name={l.seller} size={30} />
                  <div><strong>{l.seller}</strong><small>{l.sellerId} · {l.ago ? `há ${l.ago} h` : 'agora'}</small></div>
                </div>
                <div className="checks">{l.checks.map(([t, txt]) => <Badge key={txt} tone={CHECK_TONE[t]} icon={CHECK_ICON[t]}>{txt}</Badge>)}</div>
                {tab === 'review' ? (
                  <div className="listing-actions">
                    <Button size="sm" icon="eye" onClick={() => setReview(l)}>Revisar</Button>
                    <Button size="sm" variant="primary" icon="check" onClick={() => setState(l, 'approved')}>Aprovar</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" icon="undo" onClick={() => setListings((all) => all.map((x) => (x.id === l.id ? { ...x, state: 'review' } : x)))}>Voltar para análise</Button>
                )}
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>
      {!list.length && <div className="card"><Empty icon="checkCircle" title="Fila zerada" text="Nenhum anúncio nesta aba. Bom trabalho!" /></div>}

      <Modal open={!!review} onClose={() => setReview(null)} width={560} title="Revisar anúncio" subtitle={review ? `${review.seller} · ${review.sellerId}` : ''}
        footer={review && <><Button variant="danger" icon="undo" onClick={() => setState(review, 'rejected')}>Devolver ao seller</Button><Button variant="primary" icon="check" onClick={() => setState(review, 'approved')}>Aprovar e publicar</Button></>}>
        {review && <>
          <div className="product-hero">
            <ProductArt art={review.art} cat={review.cat} size={84} radius={20} />
            <div><h3>{review.title}</h3><p>{catById[review.cat].name} · {brl(review.price)} · {review.photos} fotos</p></div>
          </div>
          <div className="section-title" style={{ marginTop: 0 }}>Verificações automáticas</div>
          <div className="list">
            {[['Título e categoria coerentes', 'ok'], ['Ficha técnica completa', review.checks.some(([, t]) => t.includes('Descrição')) ? 'warn' : 'ok'], ['Nota fiscal de entrada', review.checks.some(([, t]) => t.includes('nota')) ? 'bad' : 'ok'], ['Preço dentro da política', review.checks.some(([, t]) => t.includes('Preço')) ? 'warn' : 'ok'], ['Fotos sem marca d’água', review.checks.some(([, t]) => t.includes('Fotos')) ? 'warn' : 'ok']].map(([label, t]) => (
              <div className="list-row" key={label}>
                <span className={`stat-icon tone-soft-${CHECK_TONE[t]}`} style={{ width: 26, height: 26 }}><Icon name={CHECK_ICON[t]} size={13} stroke={2.4} /></span>
                <div className="grow"><strong>{label}</strong></div>
                <Badge tone={CHECK_TONE[t]}>{t === 'ok' ? 'OK' : t === 'warn' ? 'Atenção' : 'Bloqueia'}</Badge>
              </div>
            ))}
          </div>
          <label className="field" style={{ marginTop: 14 }}><span>Motivo, se devolver</span>
            <select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select>
          </label>
        </>}
      </Modal>
    </>
  );
}
