import { makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";
import { startSchedule } from './scheduler.js';
import * as dotenv from 'dotenv';
import qrcode from 'qrcode-terminal';

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
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log('✅ Bot conectado correctamente a WhatsApp.');

      await getGroupJIDs(sock);

      // Aquí se lee el GROUP_ID desde .env
      const groupJID = process.env.GROUP_ID;

      if (!groupJID) {
        console.error('❌ ERROR: La variable de entorno GROUP_ID no está definida en .env');
        process.exit(1);
      }

      // Iniciar las encuestas con el socket y el grupo destino
      startSchedule(sock, groupJID);

    } else if (connection === 'close') {
      console.log('❌ Conexión cerrada. Reconectando...');
      startBot();
    }
  });
};

startBot();
