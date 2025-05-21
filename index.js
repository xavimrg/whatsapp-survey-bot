import makeWaSocket, {
  useSingleFileAuthState,
  DisconnectReason
} from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import P from "pino";

// Ruta donde guardaremos la sesión de forma persistente
const SESSION_FILE_PATH = '/mnt/storage/session.json';

// Cargamos o inicializamos el estado de autenticación
const { state, saveState } = useSingleFileAuthState(SESSION_FILE_PATH);

async function startSock() {
  const sock = makeWaSocket({
    logger: P({ level: 'info' }),
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if(connection === 'close') {
      const shouldReconnect = (lastDisconnect.error && 
        (lastDisconnect.error as Boom).output?.statusCode !== DisconnectReason.loggedOut);
      console.log('connection closed due to', lastDisconnect.error, ', reconnecting:', shouldReconnect);
      // Intentar reconectar solo si no fue logout
      if(shouldReconnect) {
        startSock();
      }
    } else if(connection === 'open') {
      console.log('✅ Bot conectado correctamente a WhatsApp.');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    // Aquí va el código para manejar mensajes entrantes si quieres
  });

  // Listar grupos
  const groups = await sock.groupFetchAllParticipating();
  console.log("📢 Listado de grupos disponibles:");
  Object.entries(groups).forEach(([jid, group]) => {
    console.log(`📛 Grupo: ${group.subject} → JID: ${jid}`);
  });

  return sock;
}

startSock().catch(err => console.log("error starting sock:", err));
