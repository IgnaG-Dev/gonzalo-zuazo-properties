-- Ampliación: guardar los datos de la propiedad en sí (hoy se descartaban
-- dentro de raw_scrape_data) para poder mostrarlos en la sección
-- "Inmobiliarios" (fotos, features, descripción) sin parsear el jsonb crudo
-- en cada query.

alter table leads
  add column photos jsonb not null default '[]',
  add column description text,
  add column bathrooms int,
  add column floor text,
  add column property_type text,
  add column has_lift boolean,
  add column exterior boolean,
  add column features jsonb;
