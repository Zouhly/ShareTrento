const nodemailer = require('nodemailer');
const { loadEmailConfig } = require('../config/email');

let transporter = null;
let cachedConfig = null;

const getConfig = () => {
  if (!cachedConfig) {
    cachedConfig = loadEmailConfig();
  }
  return cachedConfig;
};

const isConfigured = () => {
  const config = getConfig();
  return (
    config.enabled === true &&
    !!config.fromEmail &&
    !!config.smtp?.host &&
    !!config.smtp?.port &&
    !!config.smtp?.user &&
    !!config.smtp?.pass
  );
};

const initTransporter = () => {
  if (transporter) return transporter;

  const config = getConfig();
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: Number(config.smtp.port),
    secure: !!config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });

  return transporter;
};

const formatTripDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCarInfo = (car) => {
  if (!car) return 'N/A';
  const parts = [];
  if (car.color) parts.push(car.color);
  if (car.brand) parts.push(car.brand);
  if (car.model) parts.push(car.model);
  const base = parts.join(' ') || 'N/A';
  return car.seats ? `${base} (${car.seats} seats)` : base;
};

const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const buildBaseHtml = ({ title, subtitle, rows, ctaLabel, ctaUrl }) => {
  const rowHtml = rows
    .map(
      (row) =>
        `<tr>` +
        `<td style="padding:8px 0;color:#888888;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(row.label)}</td>` +
        `<td style="padding:8px 0;color:#1a1a1a;font-size:14px;text-align:right;">${escapeHtml(row.value)}</td>` +
        `</tr>`
    )
    .join('');

  return (
    `<!DOCTYPE html>` +
    `<html lang="en">` +
    `<head>` +
    `<meta charset="UTF-8" />` +
    `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` +
    `<title>${escapeHtml(title)}</title>` +
    `</head>` +
    `<body style="margin:0;padding:0;background:#fafafa;font-family:Arial, Helvetica, sans-serif;color:#1a1a1a;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:24px 0;">` +
    `<tr>` +
    `<td align="center">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:90%;background:#ffffff;border:1.5px solid #1a1a1a;">` +
    `<tr>` +
    `<td style="padding:24px;">` +
    `<div style="font-size:18px;text-transform:uppercase;letter-spacing:0.18em;font-weight:300;">ShareTrento</div>` +
    `<div style="height:1px;width:60px;background:#1a1a1a;margin:16px 0 24px 0;"></div>` +
    `<div style="font-size:20px;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:8px;">${escapeHtml(title)}</div>` +
    `<div style="font-size:14px;color:#666666;margin-bottom:24px;">${escapeHtml(subtitle)}</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1.5px solid #d0d0d0;border-bottom:1.5px solid #d0d0d0;">` +
    rowHtml +
    `</table>` +
    `<div style="margin-top:24px;">` +
    `<a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:10px 18px;border:1.5px solid #1a1a1a;color:#1a1a1a;text-decoration:none;text-transform:uppercase;letter-spacing:0.08em;font-size:12px;">${escapeHtml(ctaLabel)}</a>` +
    `</div>` +
    `</td>` +
    `</tr>` +
    `</table>` +
    `<div style="font-size:10px;color:#888888;text-transform:uppercase;letter-spacing:0.08em;margin-top:12px;">ShareTrento</div>` +
    `</td>` +
    `</tr>` +
    `</table>` +
    `</body>` +
    `</html>`
  );
};

const buildDriverHtml = ({ passengerName, passengerEmail, origin, destination, tripTime, appUrl }) => {
  return buildBaseHtml({
    title: 'New Booking',
    subtitle: 'A passenger joined your trip',
    rows: [
      { label: 'Passenger', value: passengerName || 'Unknown' },
      { label: 'Email', value: passengerEmail || 'Unknown' },
      { label: 'Route', value: `${origin} -> ${destination}` },
      { label: 'Departure', value: tripTime }
    ],
    ctaLabel: 'View My Trips',
    ctaUrl: `${appUrl}/my-trips`
  });
};

const buildPassengerHtml = ({ driverName, driverEmail, carInfo, origin, destination, tripTime, appUrl }) => {
  return buildBaseHtml({
    title: 'Booking Confirmed',
    subtitle: 'Your trip is confirmed',
    rows: [
      { label: 'Driver', value: driverName || 'Unknown' },
      { label: 'Email', value: driverEmail || 'Unknown' },
      { label: 'Car', value: carInfo },
      { label: 'Route', value: `${origin} -> ${destination}` },
      { label: 'Departure', value: tripTime }
    ],
    ctaLabel: 'View My Bookings',
    ctaUrl: `${appUrl}/my-bookings`
  });
};

const sendBookingNotifications = async ({ trip, passenger }) => {
  if (!isConfigured()) {
    return { skipped: true, reason: 'email_not_configured' };
  }

  if (!trip || !trip.driverId || !passenger) {
    return { skipped: true, reason: 'missing_data' };
  }

  const driver = trip.driverId;
  if (!driver.email || !passenger.email) {
    return { skipped: true, reason: 'missing_email' };
  }

  const client = initTransporter();

  const tripTime = formatTripDateTime(trip.departureTime);
  const origin = trip.origin?.address || 'Unknown';
  const destination = trip.destination?.address || 'Unknown';
  const carInfo = formatCarInfo(driver.car);
  const config = getConfig();
  const appUrl = config.appUrl || 'http://localhost:5173';

  const driverMessage = {
    to: driver.email,
    from: config.fromEmail,
    subject: 'New booking on your trip',
    text:
      `You have a new booking for your trip.\n\n` +
      `Passenger: ${passenger.name || 'Unknown'} (${passenger.email})\n` +
      `Route: ${origin} -> ${destination}\n` +
      `Departure: ${tripTime}\n\n` +
      `View your trips: ${appUrl}/my-trips`,
    html: buildDriverHtml({
      passengerName: passenger.name,
      passengerEmail: passenger.email,
      origin,
      destination,
      tripTime,
      appUrl
    })
  };

  const passengerMessage = {
    to: passenger.email,
    from: config.fromEmail,
    subject: 'Your trip booking is confirmed',
    text:
      `Your booking is confirmed.\n\n` +
      `Driver: ${driver.name || 'Unknown'} (${driver.email})\n` +
      `Car: ${carInfo}\n` +
      `Route: ${origin} -> ${destination}\n` +
      `Departure: ${tripTime}\n\n` +
      `Manage your bookings: ${appUrl}/my-bookings`,
    html: buildPassengerHtml({
      driverName: driver.name,
      driverEmail: driver.email,
      carInfo,
      origin,
      destination,
      tripTime,
      appUrl
    })
  };

  await client.sendMail(driverMessage);
  await client.sendMail(passengerMessage);

  return { sent: true };
};

module.exports = {
  sendBookingNotifications
};
