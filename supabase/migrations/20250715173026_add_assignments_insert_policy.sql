-- Permitir inserts a usuarios autenticados en assignments
CREATE POLICY "Allow authenticated insert" ON "public"."assignments"
  FOR INSERT TO "authenticated"
  WITH CHECK (true);
