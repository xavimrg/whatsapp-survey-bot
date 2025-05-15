import { makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";
import { startSchedule } from './scheduler.js';
import * as dotenv from 'dotenv';
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
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log('✅ Bot conectado correctamente a WhatsApp.');
      
      // 👇 Mostrar los grupos y sus JID
      await getGroupJIDs(sock);
      
      // 👇 Comentar esta línea temporalmente si no quieres que se activen las encuestas aún
      // startSchedule(sock);
      
    } else if (connection === 'close') {
      console.log('❌ Conexión cerrada. Reconectando...');
      startBot();
    }
  });
};

startBot();
