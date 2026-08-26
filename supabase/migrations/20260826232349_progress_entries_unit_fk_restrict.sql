-- Evitar que borrar una unidad/piso deje avances huérfanos (unit_id/floor_id NULL).
-- DEFERRABLE: al borrar un proyecto, CASCADE de progress_entries y de floors/units
-- puede resolverse al commit sin chocar con RESTRICT.

ALTER TABLE public.progress_entries
  DROP CONSTRAINT IF EXISTS progress_entries_unit_id_fkey;

ALTER TABLE public.progress_entries
  ADD CONSTRAINT progress_entries_unit_id_fkey
  FOREIGN KEY (unit_id) REFERENCES public.project_units(id)
  ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.progress_entries
  DROP CONSTRAINT IF EXISTS progress_entries_floor_id_fkey;

ALTER TABLE public.progress_entries
  ADD CONSTRAINT progress_entries_floor_id_fkey
  FOREIGN KEY (floor_id) REFERENCES public.project_floors(id)
  ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;
