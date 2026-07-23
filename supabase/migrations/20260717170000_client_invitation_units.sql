-- Teléfono en invitaciones de cliente + unidades pre-asignadas pendientes de aceptación
ALTER TABLE public.project_invitations
  ADD COLUMN IF NOT EXISTS phone text;

CREATE TABLE IF NOT EXISTS public.client_invitation_units (
  invitation_id uuid NOT NULL REFERENCES public.project_invitations (id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.project_units (id) ON DELETE CASCADE,
  PRIMARY KEY (invitation_id, unit_id)
);

CREATE INDEX IF NOT EXISTS client_invitation_units_invitation_id_idx
  ON public.client_invitation_units (invitation_id);

ALTER TABLE public.client_invitation_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_invitation_units_all_member
  ON public.client_invitation_units
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_invitations pi
      WHERE pi.id = invitation_id
        AND public.user_has_project_access (pi.project_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_invitations pi
      WHERE pi.id = invitation_id
        AND public.user_has_project_access (pi.project_id)
    )
  );
