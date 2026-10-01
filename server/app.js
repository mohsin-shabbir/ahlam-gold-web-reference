import express from 'express';
import { randomUUID } from 'node:crypto';
import { InputError, validateStay, validateBooking, quote } from './domain.js';
export function createApp(pool) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '8kb' }));
  app.get('/api/health', async (_req, res) => { await pool.query('SELECT 1'); res.json({ status: 'UP' }); });
  app.get('/api/rooms', async (_req, res) => {
    res.json((await pool.query('SELECT id, name, description, rate_minor AS "rateMinor" FROM rooms ORDER BY id')).rows);
  });
  app.get('/api/bookings', async (_req, res) => {
    res.json((await pool.query(`SELECT b.id, b.reference, r.name AS "roomName", b.guest_alias AS "guestAlias",
      to_char(b.check_in, 'YYYY-MM-DD') AS "checkIn", to_char(b.check_out, 'YYYY-MM-DD') AS "checkOut",
      b.total_minor AS "totalMinor" FROM bookings b JOIN rooms r ON r.id=b.room_id ORDER BY b.created_at DESC LIMIT 50`)).rows);
  });
  app.post('/api/quotes', async (req, res) => {
    const input = validateStay(req.body);
    const room = (await pool.query('SELECT rate_minor FROM rooms WHERE id=$1', [input.roomId])).rows[0];
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    const availability = await pool.query(`SELECT 1 FROM bookings WHERE room_id=$1
      AND daterange(check_in,check_out,'[)') && daterange($2::date,$3::date,'[)') LIMIT 1`,
      [input.roomId,input.checkIn,input.checkOut]);
    res.json({ nights: input.nights, totalMinor: quote(room.rate_minor,input.nights), currency: 'USD', available: availability.rowCount === 0 });
  });
  app.post('/api/bookings', async (req, res) => {
    const input = validateBooking(req.body);
    const parameters = [input.reference, input.roomId, input.guestAlias, input.checkIn, input.checkOut];
    const existing = async () => (await pool.query(`SELECT id, room_id=$2 AND guest_alias=$3 AND check_in=$4::date
      AND check_out=$5::date AS identical FROM bookings WHERE reference=$1`, parameters)).rows[0];
    const respondReplay = row => row.identical
      ? res.status(200).json({ id: row.id, replay: true })
      : res.status(409).json({ error: 'This request reference belongs to a different booking.' });
    const previous = await existing();
    if (previous) return respondReplay(previous);
    const room = (await pool.query('SELECT rate_minor FROM rooms WHERE id=$1',[input.roomId])).rows[0];
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    const totalMinor = quote(room.rate_minor, input.nights);
    try {
      const id = randomUUID();
      await pool.query(`INSERT INTO bookings(id,reference,room_id,guest_alias,check_in,check_out,total_minor)
        VALUES($1,$2,$3,$4,$5,$6,$7)`, [id, ...parameters, totalMinor]);
      res.status(201).json({ id, replay: false });
    } catch (error) {
      if (error.code === '23505' || error.code === '23P01') {
        const winner = await existing();
        if (winner) return respondReplay(winner);
        return res.status(409).json({ error: 'This room is already booked for part of the selected stay.' });
      }
      throw error;
    }
  });
  app.use('/api', (_req,res) => res.status(404).json({ error:'API route not found.' }));
  app.use((error, _req, res, _next) => {
    if (error instanceof InputError || error.type === 'entity.parse.failed')
      return res.status(400).json({ error: error instanceof InputError ? error.message : 'Invalid JSON.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large.' });
    console.error('Request failed:', error.code ?? error.name);
    res.status(500).json({ error: 'Unable to complete the request.' });
  });
  return app;
}

