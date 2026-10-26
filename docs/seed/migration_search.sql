-- prisma/migrations/<timestamp>_search_vector/migration.sql
-- Run AFTER `prisma migrate dev --name init` creates the tables.
-- Create with: npx prisma migrate dev --create-only --name search_vector
-- then paste this body into the generated migration.sql and run `npx prisma migrate dev`.

-- Column is declared as Unsupported("tsvector") in schema.prisma, so Prisma creates it;
-- this migration only adds the trigger that keeps it fresh and the index.

CREATE OR REPLACE FUNCTION product_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.brand, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_search_vector_trigger ON "Product";
CREATE TRIGGER product_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, brand, description ON "Product"
  FOR EACH ROW EXECUTE FUNCTION product_search_vector_update();

CREATE INDEX IF NOT EXISTS product_search_idx ON "Product" USING GIN ("searchVector");

-- Example query used by /s?k= (lib/search.ts):
--   SELECT id, ts_rank("searchVector", q) AS rank
--   FROM "Product", plainto_tsquery('english', $1) q
--   WHERE "searchVector" @@ q
--   ORDER BY rank DESC, "soldLastMonth" DESC
--   LIMIT 16 OFFSET $2;
