// Prueba real del aviso de respaldo por Brevo (auditoría BACK-2, 2026-10-22).
// La ejecuta el dueño en SU terminal. La clave se teclea sin eco (read -s), así no queda
// en el historial del shell ni en ningún archivo:
//
//   read -s BREVO_API_KEY && export BREVO_API_KEY
//   ALERT_EMAILS="info@eccofacilities.com,tu@correo.com" node scripts/alert-fallback-test.mjs
//   unset BREVO_API_KEY
//
// Opcional: BREVO_SENDER=info@eccofacilities.com (remitente verificado en Brevo; el dominio
// debe estar autenticado en Brevo porque eccofacilities.com tiene DMARC p=quarantine).
// Envía un correo de prueba con el formato del aviso interno de un lead y muestra la respuesta.
// Salida: 0 enviado · 1 falta la clave · 2 Brevo lo rechazó (el motivo sale en la línea de error) · 3 sin conexión.
import { sendOwnerAlertViaBrevo, buildOwnerEmail, formatLeadFields } from '../functions/api/submit-quote.js';

if (!process.env.BREVO_API_KEY) {
  console.error('Falta BREVO_API_KEY. Uso: read -s BREVO_API_KEY && export BREVO_API_KEY; luego ALERT_EMAILS="info@eccofacilities.com" node scripts/alert-fallback-test.mjs');
  process.exit(1);
}
const env = {
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  ALERT_EMAILS: process.env.ALERT_EMAILS || 'info@eccofacilities.com',
  BREVO_SENDER: process.env.BREVO_SENDER || 'info@eccofacilities.com',
};
const formData = { space_type: 'Office (PRUEBA)', space_size: '1,000–3,000 sq ft', cleaning_days: ['Monday', 'Wednesday'], time_of_day: ['morning'], address: '350 5th Ave, New York, NY 10118', notes: 'Correo de PRUEBA del aviso de respaldo. No es un lead real.' };
const msg = buildOwnerEmail({
  firstName: 'Prueba', lastName: 'Respaldo', email: 'prueba@example.com', phone: '', company: 'Ecco (prueba)',
  serviceLabel: 'Commercial Cleaning', refNumber: 'ECJ-PRUEBA-' + Date.now().toString(36).toUpperCase(),
  urgencyLabel: 'Standard', fields: formatLeadFields(formData), storedInCrm: false
});
let ok = false;
try {
  ok = await sendOwnerAlertViaBrevo(env, msg, 'prueba@example.com', 'test');
} catch (e) {
  console.error('SIN CONEXIÓN con api.brevo.com:', e && e.name === 'AbortError' ? 'tiempo agotado' : String(e && e.message));
  process.exit(3);
}
console.log(ok ? `OK: Brevo aceptó el correo de prueba para ${env.ALERT_EMAILS}. Revisa la bandeja (y spam).` : 'FALLO: Brevo rechazó el envío (el código de arriba dice por qué: unauthorized = clave; invalid_parameter = remitente no verificado; permission_denied = cuenta transaccional sin activar).');
process.exit(ok ? 0 : 2);
