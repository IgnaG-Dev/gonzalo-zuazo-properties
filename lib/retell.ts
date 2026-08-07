import crypto from "node:crypto";

export interface CreatePhoneCallParams {
  toNumber: string;
  dynamicVariables: Record<string, string>;
  metadata: Record<string, unknown>;
}

export interface RetellCallResponse {
  call_id: string;
  call_status: string;
  from_number: string;
  to_number: string;
  agent_id: string;
}

/**
 * Dispara una llamada saliente vía Retell (`POST /v2/create-phone-call`).
 * Usa el agente y número "from" configurados en settings/env — por ahora
 * `RETELL_FROM_NUMBER` es un número de pruebas (solo alcanza destinos de
 * EE.UU. hasta que se importe un número español vía Twilio + SIP trunk).
 */
export async function createPhoneCall({
  toNumber,
  dynamicVariables,
  metadata,
}: CreatePhoneCallParams): Promise<RetellCallResponse> {
  const apiKey = requireEnv("RETELL_API_KEY");
  const fromNumber = requireEnv("RETELL_FROM_NUMBER");
  const agentId = requireEnv("RETELL_AGENT_ID");

  const response = await fetch("https://api.retellai.com/v2/create-phone-call", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from_number: fromNumber,
      to_number: toNumber,
      override_agent_id: agentId,
      retell_llm_dynamic_variables: dynamicVariables,
      metadata,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Retell createPhoneCall falló (${response.status}): ${body}`);
  }

  return (await response.json()) as RetellCallResponse;
}

/**
 * Verifica la firma `X-Retell-Signature` de un webhook entrante: HMAC-SHA256
 * del cuerpo crudo de la petición, firmado con la API key de Retell.
 * Requiere el body sin parsear (raw string), tal como llegó en la request.
 */
export function verifyRetellSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const apiKey = requireEnv("RETELL_API_KEY");
  const expected = crypto.createHmac("sha256", apiKey).update(rawBody, "utf8").digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signatureHeader, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta variable de entorno ${name}`);
  return value;
}
