-- Datos de prueba por rol. SOLO para la base de test (buildon-test, dxseweepbihgskzxeomr).
-- Contraseña: reemplazar __TEST_PASSWORD__ antes de correrlo (está en docs/plan-etapa-2/usuarios-test.md, fuera de git).
-- Mails: owner|admin|supervisor|operador|cliente1|cliente2|ajeno @test.buildon.local
-- Se puede correr varias veces (borra y vuelve a crear lo suyo).

DO $$
DECLARE
  v_pw text := '__TEST_PASSWORD__';
  v_company uuid := '00000000-0000-4000-a000-000000000c01';
  v_project uuid := '00000000-0000-4000-a000-000000000b01';
  v_floor uuid := '00000000-0000-4000-a000-000000000f01';
  v_unit_a uuid := '00000000-0000-4000-a000-0000000000a1';
  v_unit_b uuid := '00000000-0000-4000-a000-0000000000a2';
  v_group uuid := '00000000-0000-4000-a000-000000000901';
  v_rubro uuid := '00000000-0000-4000-a000-000000000902';
  v_task uuid := '00000000-0000-4000-a000-000000000903';
  u record;
BEGIN
  -- limpiar
  DELETE FROM public.projects WHERE id = v_project;
  DELETE FROM public.companies WHERE id = v_company;
  DELETE FROM auth.users WHERE email LIKE '%@test.buildon.local';

  FOR u IN SELECT * FROM (VALUES
    ('00000000-0000-4000-a000-000000000001'::uuid, 'owner', 'Olga', 'Owner'),
    ('00000000-0000-4000-a000-000000000002'::uuid, 'admin', 'Ana', 'Admin'),
    ('00000000-0000-4000-a000-000000000003'::uuid, 'supervisor', 'Sergio', 'Supervisor'),
    ('00000000-0000-4000-a000-000000000004'::uuid, 'operador', 'Oscar', 'Operador'),
    ('00000000-0000-4000-a000-000000000005'::uuid, 'cliente1', 'Clara', 'Cliente'),
    ('00000000-0000-4000-a000-000000000006'::uuid, 'cliente2', 'Carlos', 'Cliente'),
    ('00000000-0000-4000-a000-000000000007'::uuid, 'ajeno', 'Andrés', 'Ajeno')
  ) AS t(id, slug, first_name, last_name) LOOP
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      u.slug || '@test.buildon.local', extensions.crypt(v_pw, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('first_name', u.first_name, 'last_name', u.last_name),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
    VALUES (gen_random_uuid(), u.id, u.id::text, 'email',
      jsonb_build_object('sub', u.id::text, 'email', u.slug || '@test.buildon.local', 'email_verified', true),
      now(), now(), now());
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (u.id, u.slug || '@test.buildon.local', u.first_name, u.last_name)
    ON CONFLICT (id) DO UPDATE SET first_name = excluded.first_name, last_name = excluded.last_name;
  END LOOP;

  INSERT INTO public.companies (id, name, legal_name, country) VALUES (v_company, 'Constructora de Prueba', 'Constructora de Prueba S.A.', 'Argentina');
  INSERT INTO public.company_members (company_id, user_id, role, status)
  VALUES (v_company, '00000000-0000-4000-a000-000000000001', 'owner', 'active');

  INSERT INTO public.projects (id, name, location, status, created_by, company_id)
  VALUES (v_project, 'Obra de Prueba', 'Córdoba', 'active', '00000000-0000-4000-a000-000000000001', v_company);

  -- equipo: el supervisor tiene cargo jefe_obra (antes la base no lo dejaba certificar)
  INSERT INTO public.project_members (project_id, user_id, user_type_id, role_id, is_active)
  SELECT v_project, m.uid, ut.id, pr.id, true
  FROM (VALUES
    ('00000000-0000-4000-a000-000000000001'::uuid, 'owner', 'founder'),
    ('00000000-0000-4000-a000-000000000002'::uuid, 'admin', 'gerente'),
    ('00000000-0000-4000-a000-000000000003'::uuid, 'supervisor', 'jefe_obra'),
    ('00000000-0000-4000-a000-000000000004'::uuid, 'operador', 'capataz'),
    ('00000000-0000-4000-a000-000000000005'::uuid, 'cliente', 'cliente')
  ) AS m(uid, ut_slug, pr_slug)
  JOIN public.user_types ut ON ut.slug = m.ut_slug
  JOIN public.project_roles pr ON pr.slug = m.pr_slug;

  INSERT INTO public.project_floors (id, project_id, name, sort_order) VALUES (v_floor, v_project, 'Piso 1', 1);
  INSERT INTO public.project_units (id, project_id, floor_id, unit_type_id, code, name, sort_order)
  SELECT x.id, v_project, v_floor, (SELECT id FROM public.unit_types ORDER BY sort_order LIMIT 1), x.code, x.name, x.ord
  FROM (VALUES (v_unit_a, '1A', 'Unidad 1A', 1), (v_unit_b, '1B', 'Unidad 1B', 2)) AS x(id, code, name, ord);

  INSERT INTO public.unit_clients (unit_id, user_id, status)
  VALUES (v_unit_a, '00000000-0000-4000-a000-000000000005', 'active'),
         (v_unit_b, '00000000-0000-4000-a000-000000000006', 'active');

  INSERT INTO public.rubro_groups (id, project_id, name, sort_order) VALUES (v_group, v_project, 'Obra gruesa', 1);
  INSERT INTO public.rubros (id, project_id, group_id, name, tracking_type_id, sort_order, weight_percent)
  SELECT v_rubro, v_project, v_group, 'Mampostería', id, 1, 100 FROM public.task_tracking_types ORDER BY sort_order LIMIT 1;
  INSERT INTO public.rubro_tasks (id, project_id, rubro_id, name, weight_percent, sort_order)
  VALUES (v_task, v_project, v_rubro, 'Levantar muros', 100, 1);
  INSERT INTO public.unit_task_assignments (project_id, unit_id, rubro_task_id)
  VALUES (v_project, v_unit_a, v_task), (v_project, v_unit_b, v_task);

  -- un avance en cada unidad, cargado por el operador
  INSERT INTO public.progress_entries (id, project_id, floor_id, unit_id, category_id, task_id, created_by, status, progress_state, submitted_at)
  VALUES
    ('00000000-0000-4000-a000-0000000000e1', v_project, v_floor, v_unit_a, v_rubro, v_task, '00000000-0000-4000-a000-000000000004', 'submitted', 'completed', now()),
    ('00000000-0000-4000-a000-0000000000e2', v_project, v_floor, v_unit_b, v_rubro, v_task, '00000000-0000-4000-a000-000000000004', 'submitted', 'completed', now());
END
$$;
