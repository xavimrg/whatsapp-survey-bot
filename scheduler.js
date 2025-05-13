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

const groupJid = process.env.GROUP_ID;

const enviarEncuesta = async (sock, dia, hora) => {
  const msg = `📋 *Encuesta para la clase del ${dia} a las ${hora}:*\n\n¿Qué material necesitas?\n- Casco\n- Protecciones\n- Surfskate\n- Todo`;

  await sock.sendMessage(groupJid, { text: msg });
  console.log(`📨 Encuesta enviada para ${dia} a las ${hora}`);
};

const enviarRecordatorio = async (sock) => {
  const msg = `⏰ *RECORDATORIO: ¿Has respondido a la encuesta de material de la clase de esta mañana?*\n\n// REMINDER: Did you respond to this morning's class material survey?`;
  await sock.sendMessage(groupJid, { text: msg });
  console.log(`📨 Recordatorio enviado`);
};

export function startSchedule(sock) {
  // Encuestas por la mañana (día anterior a las 22:30)
  cron.schedule('30 22 * * 0,2,4', async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const dia = dias[tomorrow.getDay()];
    const horas = horarios[dia] || [];
    const horaManana = horas.find(h => parseInt(h) < 13);
    if (horaManana) await enviarEncuesta(sock, dia, horaManana);
  });

  // Recordatorio por la mañana a las 9:00 (lunes, miércoles, viernes)
  cron.schedule('0 9 * * 1,3,5', () => enviarRecordatorio(sock));

  // Encuestas para las clases de tarde (a las 12:00 el mismo día)
  cron.schedule('0 12 * * 1-5,0', async () => {
    const now = new Date();
    const dia = dias[now.getDay()];
    const horas = horarios[dia] || [];
    const tardes = horas.filter(h => parseInt(h) >= 13);
    for (const hora of tardes) {
      await enviarEncuesta(sock, dia, hora);
    }
  });
}
