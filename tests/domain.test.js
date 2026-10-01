import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nightsBetween, validateBooking, quote } from '../server/domain.js';
test('calendar arithmetic handles leap days and year boundaries', () => {
  assert.equal(nightsBetween('2028-02-28','2028-03-01'),2);
  assert.equal(nightsBetween('2026-12-31','2027-01-02'),2);
});
test('invalid dates, reversed dates and long stays are rejected', () => {
  for (const dates of [['2026-02-30','2026-03-03'],['2026-01-02','2026-01-01'],['2026-01-01','2026-01-01'],['2026-01-01','2026-02-01'],['garbage','2026-01-02']])
    assert.throws(() => nightsBetween(...dates));
});
test('money uses integer minor units and rejects overflow', () => {
  assert.equal(quote(12000,3),36000);
  assert.throws(() => quote(1.5,3));
  assert.throws(() => quote(Number.MAX_SAFE_INTEGER,30));
});
test('booking input requires an alias, room and UUID reference', () => {
  const value = { roomId:1, checkIn:'2027-01-01',checkOut:'2027-01-03', guestAlias:' DEMO ',reference:'00000000-0000-0000-0000-000000000001' };
  assert.equal(validateBooking(value).guestAlias,'DEMO');
  assert.throws(() => validateBooking({ ...value, reference:'bad' }));
  assert.throws(() => validateBooking({ ...value, guestAlias:'' }));
  assert.throws(() => validateBooking({ ...value, roomId:1.5 }));
});

