import pkg from 'baileys';
const { makeWASocket, useSingleFileAuthState, DisconnectReason } = pkg;

import P from 'pino';

const { makeWASocket, useSingleFileAuthState, DisconnectReason } = pkg;

// Usa ruta relativa para local y absoluta para Railway
const SESSION_FILE_PATH = process.env.RAILWAY_ENVIRONMENT ? '/app/session/session.json' : './session/session.json';

const { state, saveState } = useSingleFileAuthState(SESSION_FILE_PATH);

async function startSock() {
  const sock = makeWASocket({
    logger: P({ level: 'info' }),
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = (statusCode !== DisconnectReason.loggedOut);
      console.log('connection closed due to', lastDisconnect?.error, ', reconnecting:', shouldReconnect);
      if (shouldReconnect) {
        startSock();
      }
    } else if (connection === 'open') {
      console.log('✅ Bot conectado correctamente a WhatsApp.');
    }
  });

  const groups = await sock.groupFetchAllParticipating();
  console.log("📢 Listado de grupos disponibles:");
  Object.entries(groups).forEach(([jid, group]) => {
    console.log(`📛 Grupo: ${group.subject} → JID: ${jid}`);
  });

  return sock;
}

startSock().catch(err => console.log("❌ error starting sock:", err));
