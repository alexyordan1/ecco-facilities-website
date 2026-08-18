# Quote System — Análisis profundo de funcionamiento (2026-08-18)

Método: 8 agentes usando el sistema real (3 flujos completos con edición/back-nav, caminos infelices del envío, persistencia/resume, lectura completa del backend, mapa del estado JS, triage del backlog) + verificación adversarial de cada fix aplicado (3 verificadores, 0 refutaciones). ~1.56M tokens de agentes, 96/96 e2e en 3 corridas.

**Resultado de la exploración:** 26 bugs (3 HIGH · 9 MEDIUM · 14 LOW) + 57 mejoras propuestas + 86 capacidades verificadas correctas.

## Aplicado en este pase (commit de este doc)

### Pérdida de datos del usuario (HIGH)
1. **"Save for later" tiraba lo tecleado** en Info y Location (guardaba STATE sin volcar los inputs). Ahora vuelca la pantalla actual antes de guardar.
2. **Enter dentro de un panel de edición de la revisión ENVIABA el formulario** con los valores viejos (el handler global de Enter pulsaba el CTA de la pantalla = Send). Ahora Enter = "Save changes" del panel; y valida el email inline (antes aceptaba `not-an-email` en silencio).
3. **Enter en "Other"/sqft disparaba doble** (handler local + global) saltándose la pantalla del porter. El global ahora respeta `defaultPrevented`.

### Integridad del lead hacia el CRM (MEDIUM)
4. **Day Porter puro nunca enviaba `dpDays`** → la columna "Coverage days" llegaba vacía. Ahora deriva de los porters reales al momento del envío (también arregla el caso Combined con días editados desde la revisión).
5. **Horas custom mentían**: un porter con horario por día se registraba plano con sus defaults 8–4. Ahora refleja el sobre real (inicio más temprano/fin más tardío) y no afirma horario compartido si no lo hay.
6. **El [RUSH] del correo interno estaba muerto**: el cliente nunca enviaba `urg`. "As soon as possible" ahora enciende [RUSH] en el asunto.
7. **La respuesta del aviso fuera de NYC (waitlist/continuar) se capturaba pero nunca se enviaba.** Ahora viaja como "Outside NYC" en el correo/CRM.
8. **`both` colapsaba a `janitorial`** en D1/Supabase/HubSpot (un lead combinado sobreescribía uno janitorial del mismo email). Ahora conserva `both`; el deal se llama "Combined". ⚠️ Post-deploy: verificar con UN envío combinado real que la propiedad de HubSpot acepte el valor `both` (su schema vive fuera del repo).
9. **Duplicados post-envío**: Esc/atrás desde Success reabría la revisión con el botón Send vivo (segundo POST tras el cooldown). Atrás es inerte tras enviar.
10. **Ediciones inline se revertían**: corregir email/dirección desde la revisión y volver a pasar por Info/Location restauraba los valores viejos (inputs sin sincronizar). Ahora se espejan.

### Persistencia (MEDIUM)
11. Días y franja horaria se guardan en cada toggle (recargar a mitad de la pantalla de días ya no los pierde).
12. Tras Resume, las tarjetas de Space/Size vuelven a mostrarse seleccionadas al navegar atrás.

### Robustez (LOW→fix)
13. Backend: el 502 "todo falló" ya no cuenta el correo de cortesía al cliente como éxito (el peor caso devolvía 200 con el lead evaporado); webhook-only deploys ya cuentan como configurados; el log de rate-limit no imprime la IP cruda.
14. Cliente: respuesta 200 con cuerpo corrupto ya no culpa a la conexión ni a las respuestas del usuario (mensaje propio de fallo del servidor, con retry verificado).
15. `cookie-consent.js` ya no muere con storage bloqueado (flujo completo verificado hasta Success; los 3 errores restantes en esa condición son del script de Google Maps, no nuestros).

### UX / a11y (LOW→fix)
16. La pantalla de días explica por qué Continue está deshabilitado (aria-live, patrón de la pantalla de tamaño).
17. Success: la promesa es una sola ("one business day" en desktop y móvil); el enlace del blog mide 44px.
18. La franja "what happens next" de la revisión se apila en móvil (antes 3 columnas de 106px con texto de 11.5px).
19. Anillo de foco visible en los inputs de texto (antes ninguna señal de teclado).
20. Quitar un porter con todo plegado ya no expande el Porter 1; los paneles de edición de Cleaning/Porter/Extras dicen a dónde va el "Hop back" (antes: nota confusa o cuerpo vacío).

### Limpieza acotada
21. Bloque del quiz retirado eliminado (66 líneas con copy after-hours prohibido) + `serviceCertainty` (su único output) fuera de STATE/payload/badge.
22. Selectores de animación extintos podados; nombre unificado **"Combined"** en banner de resume, toast y rail/review (antes "Both Services" en unas superficies y "Combined" en otras).
23. Test e2e actualizado: consagraba el bug #4 (esperaba `dpDays` ausente en Day Porter).

## Verificado correcto (sin cambios) — muestra
Turnstile lazy + fallback, AbortController del submit, 500/429/403/offline con mensajes correctos y retry, doble-clic = 1 POST, honeypot server-side, borradores corruptos/envejecidos sin crash, XSS del resume banner, focus trap del exit… (86 ítems en el JSON de la exploración).

## Diferido — necesita la voz/decisión de Alex
- **Horario nocturno del porter** (fin < inicio, p. ej. 6 PM–2 AM): hoy imposible de expresar; decisión de negocio/pricing.
- **Correo de confirmación** promete "a specialist reaches out" como certeza; el wizard promete llamada solo si el cliente quiere. Unificar la promesa es copy tuyo.
- **Validación server-side mínima** (solo email+nombre): endurecer podría rechazar leads degradados; recomendación: espejar caps del cliente, mantener requeridos como están.
- **Idempotencia del backend** ante doble POST (ventana de dedup): decisión de diseño.
- **UX de los Edit interstitials** (panel "Hop back" vs salto directo): rediseño, no fix.
- Presupuesto de timeouts del backend (8s × hasta 12 llamadas seriales).

## Diferido — técnica mayor (tarea aparte actualizada)
- Borrar el review builder V1 (`populateSummary` + helpers + sistema de edición V1, ~600 líneas muertas con copy prohibido dentro, invocadas como no-op en cada entrada a la revisión).
- Borrar el flow-bar desktop muerto (markup duplicado en 8 pantallas + CSS + escrituras JS).
- LOWs restantes del informe del 2026-08-18 marcados NEEDS-ALEX/DROP.
