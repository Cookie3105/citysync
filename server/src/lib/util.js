const { randomUUID } = require('node:crypto');

// Generatore di ID leggibili e univoci: es. genId('NOL') -> "NOL-a1b2c3d4".
function genId(prefix) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

// Data odierna come 'YYYY-MM-DD'.
function today(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

// Ora corrente come 'HH:MM:SS'.
function nowTime(d = new Date()) {
  return d.toTimeString().slice(0, 8);
}

// Timestamp ISO completo.
function nowIso(d = new Date()) {
  return d.toISOString();
}

// Errore HTTP con status code, intercettato dall'error handler di Express.
class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code || undefined;
  }
}

const badRequest = (m) => new HttpError(400, m);
const notFound = (m) => new HttpError(404, m);
const conflict = (m) => new HttpError(409, m);

// Distanza in metri tra due coordinate (formula di Haversine).
function distanzaMetri(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Wrapper async per route handler: inoltra gli errori al middleware di Express.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
  genId,
  today,
  nowTime,
  nowIso,
  HttpError,
  badRequest,
  notFound,
  conflict,
  distanzaMetri,
  asyncHandler,
};
