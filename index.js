import pkg from 'baileys';
import P from 'pino';

const { makeWASocket, useSingleFileAuthState, DisconnectReason } = pkg;

const SESSION_FILE_PATH = './session/session.json';
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
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('🔌 Conexión cerrada, reconectando:', shouldReconnect);
      if (shouldReconnect) startSock();
    } else if (connection === 'open') {
      console.log('✅ Bot conectado a WhatsApp');
    }
  });

  const groups = await sock.groupFetchAllParticipating();
  console.log("📢 Listado de grupos disponibles:");
  Object.entries(groups).forEach(([jid, group]) => {
    console.log(`📛 Grupo: ${group.subject} → JID: ${jid}`);
  });

  return sock;
}

startSock().catch(console.error);
