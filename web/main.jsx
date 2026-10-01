import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const money = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value/100);
const dateAfter = days => new Date(Date.now()+days*86400000).toISOString().slice(0,10);
async function api(path, body, signal) {
  const response = await fetch('/api'+path, { signal, ...(body ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Unable to complete the request.');
  return data;
}
function App() {
  const [rooms,setRooms]=useState([]);
  const [bookings,setBookings]=useState([]);
  const [form,setForm]=useState({roomId:1,guestAlias:'DEMO-GUEST',checkIn:dateAfter(1),checkOut:dateAfter(3),reference:crypto.randomUUID()});
  const [quote,setQuote]=useState(null);
  const [quoteError,setQuoteError]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [refresh,setRefresh]=useState(0);
  useEffect(() => {
    const abort=new AbortController();
    setLoading(true); setError('');
    Promise.all([api('/rooms',null,abort.signal),api('/bookings',null,abort.signal)])
      .then(([r,b]) => {setRooms(r);setBookings(b);})
      .catch(e => {if(e.name!=='AbortError')setError(e.message);})
      .finally(() => {if(!abort.signal.aborted)setLoading(false);});
    return () => abort.abort();
  },[refresh]);
  useEffect(() => {
    const abort=new AbortController();
    setQuote(null);setQuoteError('');
    api('/quotes',form,abort.signal).then(setQuote).catch(e => {if(e.name!=='AbortError')setQuoteError(e.message);});
    return () => abort.abort();
  },[form,refresh]);
  const change=(key,value) => {setNotice('');setForm(previous=>({...previous,[key]:value,reference:crypto.randomUUID()}));};
  async function submit(event) {
    event.preventDefault();setBusy(true);setError('');setNotice('');
    try {
      const result=await api('/bookings',form);
      setNotice(result.replay?'Your existing booking was recovered.':'Booking confirmed. The room is reserved for this stay.');
      setForm(previous=>({...previous,reference:crypto.randomUUID()}));
      setRefresh(previous=>previous+1);
    } catch(e) {setError(e.message);}
    finally {setBusy(false);}
  }
  const selected=rooms.find(room=>room.id===form.roomId);
  return <div className="shell">
    <header className="topbar">
      <a className="brand" href="#workspace"><span className="monogram">AG</span><span>AHLAM GOLD<small>WEB ENGINEERING REFERENCE</small></span></a>
      <nav aria-label="Main navigation"><a href="#workspace">Booking workspace</a><a href="#architecture">Architecture</a><a href="https://github.com/mohsin-shabbir/ahlam-gold-web-reference">View source ↗</a></nav>
      <span className="demo-label"><i/> SYNTHETIC DATA</span>
    </header>
    <main id="workspace">
      <section className="hero">
        <div><p className="eyebrow">HOSPITALITY · OPERATIONS · ENGINEERING</p><h1>A considered stay.<br/><em>A reliable system.</em></h1><p className="intro">A focused booking workflow inspired by Ahlam Golden.<br/>From a clear quote to a database-protected reservation.</p></div>
        <aside className="architecture-note"><span className="note-index">01 / REFERENCE WORKFLOW</span><h2>Small surface.<br/>Real integrity.</h2><p>Server-owned pricing. Stable request references. PostgreSQL protection against overlapping stays.</p><span className="stack">React <b>·</b> Node.js <b>·</b> PostgreSQL</span></aside>
      </section>
      <div className="metrics">
        <div><span>ROOM COLLECTION</span><strong>{rooms.length || '—'} <small>demo suites</small></strong></div>
        <div><span>CONFIRMED BOOKINGS</span><strong>{loading?'—':bookings.length} <small>latest 50</small></strong></div>
        <div><span>RESERVATION INTEGRITY</span><strong className="small-metric">Database enforced <span className="dot"/></strong></div>
      </div>
      {error && <div className="alert error" role="alert">{error} <button onClick={()=>setRefresh(x=>x+1)}>Retry connection</button></div>}
      {notice && <div className="alert success" role="status">{notice}</div>}
      <section className="workspace-grid">
        <form className="booking-panel" onSubmit={submit}>
          <div className="section-heading"><div><p className="eyebrow">PLAN A DEMO STAY</p><h2>Create a reservation</h2></div><span className="step">01—03</span></div>
          <label htmlFor="room">Room collection</label>
          <select id="room" value={form.roomId} onChange={e=>change('roomId',Number(e.target.value))} disabled={busy||loading}>
            {rooms.map(room=><option key={room.id} value={room.id}>{room.name} · {money(room.rateMinor)} / night</option>)}
          </select>
          <p className="field-note">{selected?.description ?? 'Connecting to the demo database…'}</p>
          <div className="date-grid"><div><label htmlFor="checkin">Check-in</label><input id="checkin" type="date" required value={form.checkIn} onChange={e=>change('checkIn',e.target.value)} disabled={busy}/></div>
          <div><label htmlFor="checkout">Check-out</label><input id="checkout" type="date" required value={form.checkOut} onChange={e=>change('checkOut',e.target.value)} disabled={busy}/></div></div>
          <label htmlFor="alias">Demo guest alias</label><input id="alias" maxLength={60} required value={form.guestAlias} onChange={e=>change('guestAlias',e.target.value)} disabled={busy} aria-describedby="alias-hint"/>
          <p id="alias-hint" className="field-note">Use a fictional alias. No real guest or payment information.</p>
          <div className="quote-box" aria-live="polite"><div><span>{quote ? quote.nights+' nights · USD' : 'Your stay estimate'}</span><strong>{quote ? money(quote.totalMinor) : '—'}</strong></div>
            <span className={quote?.available?'availability':'unavailable'}>{quote ? quote.available?'● Available':'● Dates unavailable' : quoteError || 'Calculating…'}</span></div>
          <button className="primary-button" type="submit" disabled={busy||!quote?.available||loading}>{busy?'Confirming…':'Confirm demo booking'} <span aria-hidden="true">↗</span></button>
          <p className="form-footer">No payment is taken. Reservations persist in your demo database.</p>
        </form>
        <section className="bookings-panel" aria-labelledby="bookings-title">
          <div className="section-heading"><div><p className="eyebrow">OPERATIONS OVERVIEW</p><h2 id="bookings-title">Confirmed stays</h2></div><button className="text-button" onClick={()=>setRefresh(x=>x+1)} disabled={loading||busy}>Refresh ↻</button></div>
          {loading?<div className="empty">Loading confirmed stays…</div>:bookings.length===0?<div className="empty"><span className="empty-mark">AG</span><h3>Your first stay starts here.</h3><p>Confirm a synthetic booking to see it in the operations view.</p></div>:<div className="table-scroll"><table><thead><tr><th>Guest / room</th><th>Stay</th><th>Total</th><th>Status</th></tr></thead><tbody>
            {bookings.map(b=><tr key={b.id}><td><strong>{b.guestAlias}</strong><span>{b.roomName}</span></td><td><strong>{b.checkIn}</strong><span>to {b.checkOut}</span></td><td className="amount">{money(b.totalMinor)}</td><td><span className="status">Confirmed</span></td></tr>)}
          </tbody></table></div>}
          <div className="integrity-note"><span className="shield" aria-hidden="true">✓</span><div><strong>One room. One stay at a time.</strong><p>Overlapping reservations are rejected by a PostgreSQL exclusion constraint, including concurrent requests.</p></div></div>
        </section>
      </section>
      <section id="architecture" className="architecture-strip"><div><p className="eyebrow">BUILT TO EXPLAIN</p><h2>Follow the request.</h2></div><ol><li><span>01</span>React booking form</li><li><span>02</span>Validated Node.js API</li><li><span>03</span>PostgreSQL constraints</li></ol><a href="https://github.com/mohsin-shabbir/ahlam-gold-web-reference#architecture">Read the architecture ↗</a></section>
    </main>
    <footer><span>Ahlam Gold · Public portfolio reference</span><span>Independent demo by <a href="https://github.com/mohsin-shabbir">Mohsin Shabbir</a> · Synthetic data only</span></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);

