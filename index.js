import { makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";
import { startSchedule } from './scheduler.js';
import * as dotenv from 'dotenv';
import qrcode from 'qrcode-terminal'; // 👈 Asegúrate de tener esta librería instalada

dotenv.config();

const getGroupJIDs = async (sock) => {
  const groups = await sock.groupFetchAllParticipating();
  console.log("📢 Listado de grupos disponibles:");
  for (const id in groups) {
    const name = groups[id].subject;
    console.log(`📛 Grupo: ${name} → JID: ${id}`);
  }
};

const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  const sock = makeWASocket({
    auth: state,
    browser: ['Ubuntu', 'Chrome', '22.04.4'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // ✅ Muestra el código QR en la terminal
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log('✅ Bot conectado correctamente a WhatsApp.');

      // 👇 Mostrar los grupos y sus JID
      await getGroupJIDs(sock);

      // 👇 Descomenta esta línea si quieres iniciar las encuestas
      // startSchedule(sock);

    } else if (connection === 'close') {
      console.log('❌ Conexión cerrada. Reconectando...');
      startBot();
    }
  });
};

startBot();
