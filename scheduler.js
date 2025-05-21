import cron from 'node-cron';

const horarios = {
  lunes:     ['11:00', '19:30'],
  martes:    ['19:00'],
  miércoles: ['11:00', '19:00'],
  jueves:    ['19:30'],
  viernes:   ['10:15', '18:00', '19:30'],
  domingo:   ['13:00']
};

const dias = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábado'
};

// Enviar encuesta
const enviarEncuesta = async (sock, groupJid, dia, hora) => {
  const msg = `📋 *Encuesta para la clase del ${dia} a las ${hora}:*\n\n¿Qué material necesitas?\n- Casco\n- Protecciones\n- Surfskate\n- Todo`;

  await sock.sendMessage(groupJid, { text: msg });
  console.log(`📨 Encuesta enviada para ${dia} a las ${hora}`);
};

// Enviar recordatorio
const enviarRecordatorio = async (sock, groupJid) => {
  const msg = `⏰ *RECORDATORIO: ¿Has respondido a la encuesta de material de la clase de esta mañana?*\n\n// REMINDER: Did you respond to this morning's class material survey?`;
  await sock.sendMessage(groupJid, { text: msg });
  console.log(`📨 Recordatorio enviado`);
};

// Programación de tareas
export function startSchedule(sock, groupJid) {
  // Encuestas por la noche del día anterior a las 21:00 (para clases por la mañana)
  cron.schedule('0 21 * * 1,2,3,4,5,0', async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const dia = dias[tomorrow.getDay()];
    const horas = horarios[dia] || [];
