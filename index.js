import { makeWASocket, useSingleFileAuthState, DisconnectReason } from 'baileys';
import P from 'pino';

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

  return sock;
}

startSock().catch(console.error);
