-- El input real que funciona contra el actor de Apify usa locationId +
-- locationName (no searchUrl como se había asumido inicialmente). Se agrega
-- también sinceDate: es la palanca real para no re-pagar por propiedades ya
-- scrapeadas (Apify cobra $0.003 por propiedad devuelta, sin importar si ya
-- la teníamos). scrape_search_url queda como columna en desuso, sin borrar.

alter table settings
  add column scrape_location_id text default '0-EU-ES-28-07-001-079',
  add column scrape_location_name text default 'Madrid',
  add column scrape_num_pages int not null default 5,
  add column scrape_since_date text not null default 'Y'
    check (scrape_since_date in ('', 'Y', 'W', 'M'));

update settings
set scrape_location_id = '0-EU-ES-28-07-001-079',
    scrape_location_name = 'Madrid'
where id = 1;
