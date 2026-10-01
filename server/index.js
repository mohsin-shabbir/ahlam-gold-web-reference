import { Pool } from 'pg';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL to an isolated demo PostgreSQL database.');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
const app = createApp(pool);
app.use(express.static(fileURLToPath(new URL('../dist/', import.meta.url))));
const server = app.listen(Number(process.env.PORT ?? 5085), '127.0.0.1', () => {
  console.log('Ahlam Gold reference: http://127.0.0.1:' + server.address().port);
});
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.close(async () => { await pool.end(); process.exit(0); }));

