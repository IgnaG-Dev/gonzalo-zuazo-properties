/**
 * Sanitiza un término de búsqueda antes de interpolarlo en un filtro
 * `.or()` de PostgREST — comas y paréntesis tienen significado especial en
 * esa sintaxis y romperían el filtro (o cambiarían su semántica) si vinieran
 * del input del usuario sin escapar.
 */
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()%]/g, "").trim();
}
