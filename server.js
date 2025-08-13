const path = require('path');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID || 701300453);

app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false }));

// Serve static index.html
app.use(express.static(__dirname));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

function formatCurrency(number) {
  try {
    return new Intl.NumberFormat('ru-RU').format(number) + '₽';
  } catch (_) {
    return String(number) + '₽';
  }
}

function generateOrderId() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 90 + 10); // 10..99
  return `HH${y}${m}${d}-${h}${mi}${s}-${rand}`;
}

function validateOrderPayload(body) {
  if (!body || typeof body !== 'object') return { ok: false, message: 'Некорректный запрос' };
  const { items, total, table } = body;
  if (!Array.isArray(items) || items.length === 0) return { ok: false, message: 'Корзина пуста' };
  for (const it of items) {
    if (!it || typeof it !== 'object') return { ok: false, message: 'Некорректная позиция' };
    if (typeof it.name !== 'string' || !it.name.trim()) return { ok: false, message: 'Некорректное название блюда' };
    if (!Number.isFinite(it.price) || it.price < 0) return { ok: false, message: 'Некорректная цена' };
    if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 1000) return { ok: false, message: 'Некорректное количество' };
  }
  if (!Number.isInteger(table) || table < 1 || table > 100) return { ok: false, message: 'Номер столика должен быть от 1 до 100' };
  const validatedTotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  return { ok: true, items, totalClient: Number(total) || validatedTotal, totalServer: validatedTotal, table };
}

app.post('/api/order', async (req, res) => {
  const validation = validateOrderPayload(req.body);
  if (!validation.ok) {
    return res.status(400).json({ ok: false, message: validation.message });
  }
  const { items, totalServer, table } = validation;
  const orderId = generateOrderId();

  const lines = items.map((it, idx) => `${idx + 1}) ${it.name} — ${formatCurrency(it.price)} × ${it.quantity} = ${formatCurrency(it.price * it.quantity)}`).join('\n');
  const text = [
    `Новый заказ #${orderId}`,
    `Столик: ${table}`,
    '',
    'Позиции:',
    lines,
    '',
    `Итого: ${formatCurrency(totalServer)}`
  ].join('\n');

  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN is not set. Printing order to console instead of sending to Telegram.');
    console.log(text);
    return res.json({ ok: true, orderId, demo: true, message: 'Демо-режим: сообщение не отправлено в Telegram' });
  }

  const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    await axios.post(tgUrl, { chat_id: ADMIN_CHAT_ID, text });
    return res.json({ ok: true, orderId });
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error('Failed to send Telegram message', status, data || error.message);
    return res.status(502).json({ ok: false, message: 'Не удалось отправить сообщение администратору' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('Warning: TELEGRAM_BOT_TOKEN is not configured. Orders will be logged to console.');
  } else {
    console.log('Telegram notifications are enabled.');
  }
});