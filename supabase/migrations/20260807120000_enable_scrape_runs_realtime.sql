-- Habilita Supabase Realtime sobre scrape_runs para que /scrapes se actualice
-- en vivo (INSERT al disparar una corrida, UPDATE cuando llega el webhook de
-- Apify) sin que el usuario tenga que recargar la página.
alter publication supabase_realtime add table scrape_runs;
