const APIFY_API_BASE = "https://api.apify.com/v2";

export interface TriggerScrapeRunParams {
  locationId: string;
  locationName: string;
  numPages?: number;
  /** '' = cualquier momento, 'Y' = últimas 48h, 'W' = última semana, 'M' = último mes (operation=sale). */
  sinceDate?: "" | "Y" | "W" | "M";
}

export interface ApifyRunResponse {
  data: {
    id: string;
    actId: string;
    status: string;
    defaultDatasetId: string;
  };
}

/**
 * Dispara una corrida del actor sian.agency/smart-idealista-scraper con la
 * ubicación guardada en settings, registrando un webhook de finalización
 * hacia /api/ingest/apify (evita tener que hacer polling).
 *
 * El actor cobra por resultado devuelto ($0.003/propiedad) sin importar si
 * ya la teníamos en la base — por eso `sinceDate` es clave: limita cada
 * corrida a lo publicado desde la última vez, en vez de re-traer (y pagar
 * de nuevo por) todo el listado cada corrida.
 */
export async function triggerScrapeRun({
  locationId,
  locationName,
  numPages = 5,
  sinceDate = "Y",
}: TriggerScrapeRunParams): Promise<ApifyRunResponse["data"]> {
  const token = requireEnv("APIFY_API_TOKEN");
  const actorId = requireEnv("APIFY_ACTOR_ID");
  const appBaseUrl = requireEnv("APP_BASE_URL");
  const webhookSecret = requireEnv("APIFY_INGEST_WEBHOOK_SECRET");

  const webhookUrl = `${appBaseUrl}/api/ingest/apify?secret=${encodeURIComponent(webhookSecret)}`;

  const webhooks = [
    {
      eventTypes: [
        "ACTOR.RUN.SUCCEEDED",
        "ACTOR.RUN.FAILED",
        "ACTOR.RUN.ABORTED",
        "ACTOR.RUN.TIMED_OUT",
      ],
      requestUrl: webhookUrl,
    },
  ];
  const webhooksBase64 = Buffer.from(JSON.stringify(webhooks)).toString("base64");

  // Input confirmado contra una corrida real y funcionando del actor (no el
  // esquema documentado en Apify Store, que difiere en algunos nombres).
  // Los filtros booleanos van todos en false = sin filtrar por esa condición.
  const input = {
    country: "es",
    operation: "sale",
    endpoint: "listhomes",
    locationId,
    locationName,
    numPages,
    order: "mostrecent",
    language: "en",
    deepFieldSet: "extended",
    sinceDate,
    furnished: "",
    accessible: false,
    airConditioning: false,
    apartamentoType: false,
    atticStudioType: false,
    bankOffer: false,
    bathrooms1: false,
    bathrooms2: false,
    bathrooms3: false,
    bedrooms0: false,
    bedrooms1: false,
    bedrooms2: false,
    bedrooms3: false,
    bedrooms4: false,
    builtinWardrobes: false,
    casaBajaType: false,
    chalet: false,
    cortijoType: false,
    countryHouse: false,
    duplex: false,
    elevator: false,
    exterior: false,
    flat: false,
    garage: false,
    garden: false,
    good: false,
    hasPlan: false,
    independantHouse: false,
    intermediateFloor: false,
    isBareOwnership: false,
    isFree: false,
    isIllegallyOccupied: false,
    isTenanted: false,
    loftType: false,
    longTermResidential: false,
    luxury: false,
    newDevelopment: false,
    onlyFlats: false,
    penthouse: false,
    petsAllowed: false,
    renew: false,
    semidetachedHouse: false,
    shortTerm: false,
    storeRoom: false,
    swimmingPool: false,
    terracedHouse: false,
    terrance: false,
    topFloor: false,
    villaType: false,
    virtualTour: false,
  };

  const url = `${APIFY_API_BASE}/acts/${encodeURIComponent(actorId)}/runs?token=${encodeURIComponent(
    token
  )}&webhooks=${encodeURIComponent(webhooksBase64)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Apify triggerScrapeRun falló (${response.status}): ${body}`);
  }

  const json = (await response.json()) as ApifyRunResponse;
  return json.data;
}

/** Obtiene el estado actual de una corrida (usado para reconciliar tras el webhook). */
export async function fetchRun(runId: string): Promise<ApifyRunResponse["data"]> {
  const token = requireEnv("APIFY_API_TOKEN");
  const response = await fetch(
    `${APIFY_API_BASE}/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Apify fetchRun falló (${response.status}): ${body}`);
  }

  const json = (await response.json()) as ApifyRunResponse;
  return json.data;
}

/** Descarga todos los items del dataset de resultados de una corrida. */
export async function fetchDatasetItems(datasetId: string): Promise<Record<string, unknown>[]> {
  const token = requireEnv("APIFY_API_TOKEN");
  const response = await fetch(
    `${APIFY_API_BASE}/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(
      token
    )}&format=json&clean=true`
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Apify fetchDatasetItems falló (${response.status}): ${body}`);
  }

  return (await response.json()) as Record<string, unknown>[];
}

export interface ApifyDatasetInfo {
  id: string;
  itemCount: number;
}

/** Metadata del dataset de una corrida — itemCount se actualiza en vivo mientras el actor corre. */
export async function fetchDatasetInfo(datasetId: string): Promise<ApifyDatasetInfo> {
  const token = requireEnv("APIFY_API_TOKEN");
  const response = await fetch(
    `${APIFY_API_BASE}/datasets/${encodeURIComponent(datasetId)}?token=${encodeURIComponent(token)}`
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Apify fetchDatasetInfo falló (${response.status}): ${body}`);
  }

  const json = (await response.json()) as { data: ApifyDatasetInfo };
  return json.data;
}

/** Últimas líneas del log en vivo de la corrida — texto real emitido por el actor, sin procesar. */
export async function fetchRunLogTail(runId: string, maxLines = 15): Promise<string[]> {
  const token = requireEnv("APIFY_API_TOKEN");
  const response = await fetch(
    `${APIFY_API_BASE}/actor-runs/${encodeURIComponent(runId)}/log?token=${encodeURIComponent(token)}`
  );

  // El log puede no estar disponible todavía justo al arrancar la corrida.
  if (!response.ok) return [];

  const text = await response.text();
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(-maxLines);
}

export interface MappedPropertyFeatures {
  hasSwimmingPool?: boolean;
  hasTerrace?: boolean;
  hasAirConditioning?: boolean;
  hasBoxRoom?: boolean;
  hasGarden?: boolean;
}

export interface MappedLead {
  idealista_property_code: string;
  source_url: string | null;
  address: string | null;
  price: number | null;
  size_m2: number | null;
  rooms: number | null;
  owner_name: string | null;
  phone_raw: string | null;
  seller_type: string | null;
  raw_scrape_data: Record<string, unknown>;
  /** true si el anuncio pertenece a una agencia (no particular) — se excluye del pipeline. */
  isAgency: boolean;
  photos: string[];
  description: string | null;
  bathrooms: number | null;
  floor: string | null;
  property_type: string | null;
  has_lift: boolean | null;
  exterior: boolean | null;
  features: MappedPropertyFeatures | null;
}

interface ApifyContactPhone {
  phoneNumberForMobileDialing?: string;
  formattedPhone?: string;
}

interface ApifyContactInfo {
  contactName?: string;
  userType?: string;
  phone1?: ApifyContactPhone;
}

/**
 * Mapea un item crudo del dataset de Apify (sian.agency/smart-idealista-scraper)
 * a la forma que espera la tabla `leads`. Nombres de campo confirmados contra
 * un output real del actor (endpoint listhomes, operation sale).
 */
export function mapApifyItemToLead(item: Record<string, unknown>): MappedLead {
  const propertyCode = String(item.propertyCode ?? "");

  // El actor expone isAgency directamente — sin heurística de texto.
  const isAgency = item.isAgency === true;

  const contactInfo = (item.contactInfo ?? {}) as ApifyContactInfo;
  const phone1 = contactInfo.phone1 ?? {};

  const phoneRaw =
    phone1.phoneNumberForMobileDialing ??
    (item.agentPhoneRaw as string | undefined) ??
    phone1.formattedPhone ??
    (item.agentPhone as string | undefined) ??
    null;

  const ownerName = contactInfo.contactName ?? (item.agentName as string | undefined) ?? null;

  const sellerType = contactInfo.userType ?? null;

  // "address" en el dataset repite el title (no es una dirección real) —
  // el barrio/distrito/municipio es lo único fiable para mostrar ubicación.
  const address =
    [item.neighborhood, item.district, item.municipality]
      .filter((part): part is string => typeof part === "string" && part.length > 0)
      .join(", ") ||
    (item.address as string | undefined) ||
    (item.title as string | undefined) ||
    null;

  const photos = Array.isArray(item.allImages)
    ? (item.allImages as unknown[]).filter((url): url is string => typeof url === "string")
    : [];

  const features = (item.features && typeof item.features === "object" ? item.features : null) as
    | MappedPropertyFeatures
    | null;

  return {
    idealista_property_code: propertyCode,
    source_url: (item.url as string) ?? null,
    address,
    price: toNumberOrNull(item.price),
    size_m2: toNumberOrNull(item.size),
    rooms: toIntOrNull(item.rooms),
    owner_name: ownerName,
    phone_raw: phoneRaw,
    seller_type: sellerType,
    raw_scrape_data: item,
    isAgency,
    photos,
    description: (item.description as string | undefined) ?? null,
    bathrooms: toIntOrNull(item.bathrooms),
    floor: (item.floor as string | undefined) ?? null,
    property_type: (item.propertyType as string | undefined) ?? null,
    has_lift: typeof item.hasLift === "boolean" ? item.hasLift : null,
    exterior: typeof item.exterior === "boolean" ? item.exterior : null,
    features,
  };
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "string" ? Number(value.replace(/[^\d.,-]/g, "").replace(",", ".")) : Number(value);
  return Number.isFinite(num) ? num : null;
}

function toIntOrNull(value: unknown): number | null {
  const num = toNumberOrNull(value);
  return num === null ? null : Math.trunc(num);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta variable de entorno ${name}`);
  return value;
}
