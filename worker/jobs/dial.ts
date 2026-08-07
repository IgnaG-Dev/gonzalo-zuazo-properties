import { runDialBatch } from "../../lib/dial";

/**
 * Job programado de marcado. El chequeo de `settings.is_dialing_enabled` y
 * el resto de reglas de elegibilidad viven dentro de runDialBatch/getEligibleLeads
 * — no hay trigger manual de llamadas (decisión de producto: 100% automáticas).
 */
export async function runDialJob(): Promise<void> {
  try {
    const result = await runDialBatch();
    if (result.attempted > 0) {
      console.log(
        `[worker/dial] batch procesado: ${result.attempted} intentos, ${result.succeeded} ok, ${result.failed} fallidos`
      );
    }
  } catch (error) {
    console.error("[worker/dial] error procesando batch", error);
  }
}
