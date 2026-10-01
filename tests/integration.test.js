import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { createApp } from '../server/app.js';
if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL to an isolated test database.');
const schema = 'test_' + randomUUID().replaceAll('-','');
const admin = new Pool({connectionString:process.env.TEST_DATABASE_URL});
let pool, server, base;
before(async () => {
  await admin.query('CREATE EXTENSION IF NOT EXISTS btree_gist');
  await admin.query('CREATE SCHEMA "' + schema + '"');
  pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options:'-c search_path=' + schema + ',public' });
  await pool.query(await readFile(new URL('../db/schema.sql', import.meta.url),'utf8'));
  server = createApp(pool).listen(0,'127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (pool) await pool.end();
  await admin.query('DROP SCHEMA "' + schema + '" CASCADE');
  await admin.end();
});
const request = overrides => ({reference:randomUUID(),roomId:1,guestAlias:'DEMO-GUEST',checkIn:'2030-01-01',checkOut:'2030-01-03',...overrides});
const post = (path,body) => fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
test('server prices override client totals, replays are stable and conflicts reject',async () => {
  const body=request({totalMinor:1});
  const first=await post('/api/bookings',body); assert.equal(first.status,201);
  const created=await first.json();
  const replay=await post('/api/bookings',body); assert.equal(replay.status,200);
  assert.equal((await replay.json()).id,created.id);
  assert.equal((await post('/api/bookings',{...body,guestAlias:'CHANGED'})).status,409);
  const row=(await pool.query('SELECT total_minor FROM bookings WHERE id=$1',[created.id])).rows[0];
  assert.equal(row.total_minor,24000);
});
test('database prevents concurrent overlapping reservations but permits adjacent stays',async () => {
  const [a,b]=await Promise.all([post('/api/bookings',request({roomId:2})),post('/api/bookings',request({roomId:2}))]);
  assert.deepEqual([a.status,b.status].sort(),[201,409]);
  assert.equal((await post('/api/bookings',request({roomId:2,checkIn:'2030-01-03',checkOut:'2030-01-04'}))).status,201);
});
test('quotes reflect availability and invalid requests return 400',async () => {
  const response=await post('/api/quotes',request({roomId:3}));
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{nights:2,totalMinor:36000,currency:'USD',available:true});
  assert.equal((await post('/api/bookings',request({checkOut:'bad'}))).status,400);
});

