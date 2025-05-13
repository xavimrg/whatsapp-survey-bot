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

// Enviar encuesta
const enviarEncuesta = async (sock, dia, hora) => {
  const msg = `📋 *Encuesta para la clase del ${dia} a las ${hora}:*\n\n¿Qué material necesitas?\n- Casco\n- Protecciones\n- Surfskate\n- Todo`;

  await sock.sendMessage(groupJid, { text: msg });
  console.log(`📨 Encuesta enviada para ${dia} a las ${hora}`);
};

// Enviar recordatorio
const enviarRecordatorio = async (sock) => {
  const msg = `⏰ *RECORDATORIO: ¿Has respondido a la encuesta de material de la clase de esta mañana?*\n\n// REMINDER: Did you respond to this morning's class material survey?`;
  await sock.sendMessage(groupJid, { text: msg });
  console.log(`📨 Recordatorio enviado`);
};

// Programación de tareas
export function startSchedule(sock) {
  // Encuestas por la mañana (día anterior a las 21:00)
  cron.schedule('0 21 * * 1,2,3,4,5,0', async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const dia = dias[tomorrow.getDay()];
    const horas = horarios[dia] || [];
    const horaManana = horas.find(h => parseInt(h) < 13);
    if (horaManana) await enviarEncuesta(sock, dia, horaManana);
  });

  // Recordatorio por la mañana a las 8:45 (lunes, miércoles, viernes)
  cron.schedule('45 8 * * 1,3,5', () => enviarRecordatorio(sock));

  // Recordatorio para domingo a las 9:10
  cron.schedule('10 9 * * 0', () => enviarRecordatorio(sock));

  // Encuestas para las clases de tarde (a las 12:30)
  cron.schedule('30 12 * * 1-5,0', async () => {
    const now = new Date();
    const dia = dias[now.getDay()];
    const horas = horarios[dia] || [];
    const tardes = horas.filter(h => parseInt(h) >= 13);
    
    // Para el viernes, enviar una sola encuesta mencionando los dos horarios
    if (dia === 'viernes') {
      await enviarEncuesta(sock, dia, '18:00 y 19:30');
    } else {
      for (const hora of tardes) {
        await enviarEncuesta(sock, dia, hora);
      }
    }
  });
}
