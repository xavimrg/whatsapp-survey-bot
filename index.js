const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@adiwajshing/baileys');
const P = require('pino');
const fs = require('fs');
const cron = require('node-cron');
require('dotenv').config();

// Ruta de sesión
const SESSION_FILE_PATH = './session/session.json';
const { state, saveState } = useSingleFileAuthState(SESSION_FILE_PATH);

let sock;

async function startSock() {
  sock = makeWASocket({
    logger: P({ level: 'info' }),
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('🔐 Escanea este QR con WhatsApp Business');
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Conexión cerrada. Reconectando:', shouldReconnect);
      if (shouldReconnect) startSock();
    } else if (connection === 'open') {
      console.log('✅ Bot conectado a WhatsApp');
      setupScheduledMessages(); // Activamos las encuestas
    }
  });
}

// 💬 ENVÍA UN MENSAJE A UN GRUPO
async function sendMessageToGroup(jid, text) {
  if (!sock) return console.log('⛔️ Socket no inicializado');
  await sock.sendMessage(jid, { text });
  console.log(`📤 Mensaje enviado a ${jid}`);
}

// 🕓 PROGRAMACIÓN DE ENCUESTAS / RECORDATORIOS
function setupScheduledMessages() {
  // 🔁 Recordatorio domingo mañana (domingo 9:10)
  cron.schedule('10 9 * * 0', () => {
    sendMessageToGroup(process.env.SUNDAY_GROUP_JID, '🌊 ¡Nos vemos en la clase de surf de hoy!');
  });

  // 📋 Encuesta para clase del domingo (sábado 21:00)
  cron.schedule('0 21 * * 6', () => {
    sendMessageToGroup(process.env.SUNDAY_GROUP_JID, '🗳 ¿Vendrás mañana a la clase de surf a las 13:00? Responde con sí o no.');
  });

  // 📋 Encuesta viernes tarde (jueves 21:00)
  cron.schedule('0 21 * * 4', () => {
    sendMessageToGroup(process.env.FRIDAY_GROUP_JID, '🗳 ¿Vendrás mañana a las clases de las 18:00 o 19:30? Responde con hora y sí/no.');
  });

  console.log('✅ Programación de encuestas activada');
}

startSock();
