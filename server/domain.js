export class InputError extends Error {}
export function nightsBetween(start, end) {
  const parse = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new InputError('Use valid calendar dates.');
    const date = new Date(value + 'T00:00:00Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new InputError('Use valid calendar dates.');
    return date.getTime();
  };
  const nights = (parse(end) - parse(start)) / 86400000;
  if (!Number.isInteger(nights) || nights < 1 || nights > 30) throw new InputError('Choose a stay between 1 and 30 nights.');
  return nights;
}
export function validateStay(body) {
  if (!body || !Number.isInteger(body.roomId) || body.roomId < 1) throw new InputError('Choose a room.');
  return { roomId: body.roomId, checkIn: body.checkIn, checkOut: body.checkOut,
    nights: nightsBetween(body.checkIn, body.checkOut) };
}
export function validateBooking(body) {
  const stay = validateStay(body);
  if (typeof body.guestAlias !== 'string' || !body.guestAlias.trim() || body.guestAlias.trim().length > 60)
    throw new InputError('Provide a demo guest alias of 1–60 characters.');
  if (typeof body.reference !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.reference))
    throw new InputError('A valid request reference is required.');
  return { ...stay, guestAlias: body.guestAlias.trim(), reference: body.reference.toLowerCase() };
}
export function quote(rateMinor, nights) {
  if (!Number.isSafeInteger(rateMinor) || rateMinor <= 0 || !Number.isInteger(nights) || nights < 1 || nights > 30)
    throw new InputError('Invalid price or stay length.');
  const totalMinor = rateMinor * nights;
  if (!Number.isSafeInteger(totalMinor) || totalMinor > 2147483647) throw new InputError('Quote exceeds supported amount.');
  return totalMinor;
}

