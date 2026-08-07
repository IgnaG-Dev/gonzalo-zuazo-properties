# Gonzalo Zuazo Properties — Panel Admin

Panel privado (un solo usuario admin) que capta leads de vendedores particulares en Idealista vía un
actor de Apify y dispara llamadas automáticas con IA (Retell) para calificar interés y agendar reunión.

`web` (`node server.js`) y `worker` (`node dist-worker/worker/index.js`) se construyen desde la misma
imagen Docker — ver Dockerfile.

## Stack

Next.js (App Router, TypeScript) + Supabase (Postgres + Auth) + Tailwind. Un solo build Docker,
desplegado como dos servicios EasyPanel: `web` (`node server.js`) y `worker` (`node dist-worker/worker/index.js`).

## Setup local

```bash
npm install
cp .env.local.example .env.local   # completar con las keys reales
```

1. Las migraciones en `supabase/migrations/` ya están aplicadas contra el proyecto Supabase remoto (via MCP). Si necesitás recrear el esquema en otro proyecto: SQL editor o `supabase db push`, en orden.
2. Crear el usuario admin desde el dashboard de Supabase → Authentication → Users (el trigger crea
   automáticamente su fila espejo en `usuarios`). No hay self-signup en la app.
3. `npm run dev` (web) y, en otra terminal, `npm run worker:dev` (scheduler).

## Pipeline de scraping

`lib/apify.ts` (`mapApifyItemToLead`) está validado contra un output real del actor
`sian.agency/smart-idealista-scraper` (endpoint `listhomes`, `operation: sale`). Notas del mapeo:

- `isAgency` viene como booleano explícito en el item — no hace falta heurística de texto. Confirmado
  también en particulares: `isAgency: false` + `contactInfo.userType: "private"`.
- `address` en el dataset repite el `title` (no es una dirección real); se compone a partir de
  `neighborhood` / `district` / `municipality`.
- `phone_raw` sale de `contactInfo.phone1.phoneNumberForMobileDialing` (ya viene casi en E.164; se
  vuelve a normalizar con `normalizeToE164Spain` de todos modos). Algunos particulares no exponen
  teléfono en absoluto (`contactMethod: "email"`, sin `contactInfo.phone1`) — `mapApifyItemToLead`
  devuelve `phone_raw: null` en ese caso sin romper, y el lead simplemente nunca es elegible para
  llamar (la elegibilidad exige `phone_e164 not null`).
- El input de `triggerScrapeRun` usa `locationId` + `locationName` (no `searchUrl` — el actor soporta
  ambos, pero este es el input probado y funcionando en la cuenta real). Configurable en `/settings`
  junto con `scrape_num_pages` y `scrape_since_date`.
- **Costo por resultado**: el actor cobra $0.005 por corrida + $0.003 por propiedad devuelta, sin
  importar si ya estaba en la base. `scrape_since_date` (`Y`=48h, `W`=semana, `M`=mes, ``=todo) es la
  única palanca real para no re-pagar por el mismo listado en cada corrida — el upsert por
  `idealista_property_code` en `lib/ingest.ts` evita duplicados en la base, pero no evita el cargo de
  Apify por re-scrapear algo ya conocido.

## Verificación end-to-end

1. `npm run build` y `npm run typecheck` — sin errores.
2. Probar `/api/ingest/apify` con un run real o payload simulado → confirmar que se crean leads, se
   excluyen agencias y duplicados.
3. Configurar en el dashboard de Retell el campo custom `interest_level` (enum) y `meeting_requested`
   en el agente; hacer una llamada de prueba al número de pruebas y confirmar que
   `/api/webhooks/retell` actualiza `leads.status` y `call_logs` correctamente.
4. Dejar el worker corriendo con `dial_schedule_cron` corto en un entorno de prueba y confirmar que
   solo llama a leads elegibles, respeta el horario configurado, y detiene reintentos al llegar a
   `max_call_attempts` o al cambiar a un estado terminal.
5. Build de la imagen Docker y despliegue de los dos servicios en EasyPanel con las mismas variables
   de entorno en ambos.

## Riesgos conocidos (no bloquean el desarrollo)

- **Idealista/ToS**: el actor de Apify puede romperse si Idealista cambia su sitio o bloquea el pool
  de proxies. Se trata como fuente "best effort" — los errores de scrape run se muestran en `/scrapes`.
- **Retell + números fuera de EE. UU.**: el número comprado directo en Retell (`RETELL_FROM_NUMBER`,
  configurable en `/settings`) solo permite llamar a destinos de EE. UU. Para producción en España
  hace falta importar un número vía Twilio + SIP trunk — paso de configuración de cuenta, no de código.
- **Teléfonos**: normalizados a E.164 con `libphonenumber-js`, región `ES`.
- **GDPR / Lista Robinson**: `do_not_call` cubre solo bloqueos manuales o detectados durante la
  llamada (el agente debe identificarse y ofrecer "no volver a llamar", mapeado automáticamente a
  exclusión) — no es una integración con la Lista Robinson oficial.
- **Webhooks de Retell**: pueden reintentar entregas — `call_logs` es upsert-safe por `retell_call_id`.
- **Webhook de Apify**: Apify no firma con HMAC, solo soporta secreto en query string — se valida
  además que `resource.id` corresponda a un `scrape_runs` que nosotros mismos creamos al disparar la
  corrida (ver `lib/ingest.ts`).
