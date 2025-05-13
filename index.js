import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';
import dotenv from 'dotenv';
import { startSchedule } from './scheduler.js';

dotenv.config();

const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log('✅ Bot conectado correctamente a WhatsApp.');
      startSchedule(sock); // Lanzamos las tareas programadas
    } else if (connection === 'close') {
      console.log('❌ Conexión cerrada. Reconectando...');
      startBot();
    }
  });
};

startBot();
