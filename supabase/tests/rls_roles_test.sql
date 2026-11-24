-- Prueba de RLS por rol en la base de test. Requiere supabase/tests/seed_roles_test.sql.
-- Simula cada usuario (role authenticated + JWT con su id) y anota qué puede leer y
-- escribir. Las escrituras se deshacen siempre (subtransacción que termina en error).
CREATE TEMP TABLE rls_result (usuario text, prueba text, resultado text, orden serial);
GRANT ALL ON rls_result TO authenticated;
GRANT USAGE ON SEQUENCE rls_result_orden_seq TO authenticated;

DO $$
DECLARE
  v_project uuid := '00000000-0000-4000-a000-000000000b01';
  u record;
  n int;
  tests text[][] := ARRAY[
    ['lee: obra',               'SELECT count(*) FROM projects WHERE id = ''00000000-0000-4000-a000-000000000b01'''],
    ['lee: avances',            'SELECT count(*) FROM progress_entries WHERE project_id = ''00000000-0000-4000-a000-000000000b01'''],
    ['lee: avances vía RPC',    'SELECT count(*) FROM latest_progress_entries(''00000000-0000-4000-a000-000000000b01'')'],
    ['lee: unidades',           'SELECT count(*) FROM project_units WHERE project_id = ''00000000-0000-4000-a000-000000000b01'''],
    ['lee: tareas por unidad',  'SELECT count(*) FROM unit_task_assignments WHERE project_id = ''00000000-0000-4000-a000-000000000b01'''],
    ['lee: clientes de unidades','SELECT count(*) FROM unit_clients uc JOIN project_units pu ON pu.id = uc.unit_id WHERE pu.project_id = ''00000000-0000-4000-a000-000000000b01'''],
    ['lee: equipo',             'SELECT count(*) FROM project_members WHERE project_id = ''00000000-0000-4000-a000-000000000b01''']
  ];
  writes text[][] := ARRAY[
    ['carga avance (unidad 1A)', $w$INSERT INTO progress_entries (project_id, floor_id, unit_id, category_id, task_id, created_by, status, progress_state)
       VALUES ('00000000-0000-4000-a000-000000000b01','00000000-0000-4000-a000-000000000f01','00000000-0000-4000-a000-0000000000a1','00000000-0000-4000-a000-000000000902','00000000-0000-4000-a000-000000000903', auth.uid(), 'submitted', 'completed')$w$],
    ['carga avance ya aprobado', $w$INSERT INTO progress_entries (project_id, floor_id, unit_id, category_id, task_id, created_by, status, progress_state)
       VALUES ('00000000-0000-4000-a000-000000000b01','00000000-0000-4000-a000-000000000f01','00000000-0000-4000-a000-0000000000a1','00000000-0000-4000-a000-000000000902','00000000-0000-4000-a000-000000000903', auth.uid(), 'approved', 'completed')$w$],
    ['certifica avance (update)', $w$UPDATE progress_entries SET status = 'approved' WHERE id = '00000000-0000-4000-a000-0000000000e1'$w$],
    ['certifica avance (validación)', $w$INSERT INTO progress_validations (progress_entry_id, validated_by, decision) VALUES ('00000000-0000-4000-a000-0000000000e1', auth.uid(), 'approved')$w$],
    ['se asigna unidad 1B', $w$INSERT INTO unit_clients (unit_id, user_id, status) VALUES ('00000000-0000-4000-a000-0000000000a2', auth.uid(), 'active')$w$],
    ['edita datos de la obra', $w$UPDATE projects SET name = name || ' x' WHERE id = '00000000-0000-4000-a000-000000000b01'$w$],
    ['agrega un piso', $w$INSERT INTO project_floors (project_id, name, sort_order) VALUES ('00000000-0000-4000-a000-000000000b01', 'Piso X', 9)$w$]
  ];
  i int;
BEGIN
  FOR u IN SELECT * FROM (VALUES
    ('owner', '00000000-0000-4000-a000-000000000001'), ('admin', '00000000-0000-4000-a000-000000000002'),
    ('supervisor', '00000000-0000-4000-a000-000000000003'), ('operador', '00000000-0000-4000-a000-000000000004'),
    ('cliente1', '00000000-0000-4000-a000-000000000005'), ('cliente2', '00000000-0000-4000-a000-000000000006'),
    ('ajeno', '00000000-0000-4000-a000-000000000007')
  ) AS t(name, id) LOOP
    PERFORM set_config('request.jwt.claims', json_build_object('sub', u.id, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    FOR i IN 1 .. array_length(tests, 1) LOOP
      EXECUTE tests[i][2] INTO n;
      INSERT INTO rls_result (usuario, prueba, resultado) VALUES (u.name, tests[i][1], n::text);
    END LOOP;
    FOR i IN 1 .. array_length(writes, 1) LOOP
      BEGIN
        EXECUTE writes[i][2];
        GET DIAGNOSTICS n = ROW_COUNT;
        RAISE EXCEPTION 'rollback:%', n;
      EXCEPTION WHEN others THEN
        IF SQLERRM LIKE 'rollback:%' THEN
          INSERT INTO rls_result (usuario, prueba, resultado)
          VALUES (u.name, writes[i][1], CASE WHEN split_part(SQLERRM, ':', 2) = '0' THEN 'no (0 filas)' ELSE 'sí' END);
        ELSE
          INSERT INTO rls_result (usuario, prueba, resultado) VALUES (u.name, writes[i][1], 'no');
        END IF;
      END;
    END LOOP;
    RESET ROLE;
  END LOOP;
END
$$;

SELECT prueba,
  max(resultado) FILTER (WHERE usuario = 'owner') AS owner,
  max(resultado) FILTER (WHERE usuario = 'admin') AS admin,
  max(resultado) FILTER (WHERE usuario = 'supervisor') AS supervisor,
  max(resultado) FILTER (WHERE usuario = 'operador') AS operador,
  max(resultado) FILTER (WHERE usuario = 'cliente1') AS cliente1,
  max(resultado) FILTER (WHERE usuario = 'cliente2') AS cliente2,
  max(resultado) FILTER (WHERE usuario = 'ajeno') AS ajeno
FROM rls_result GROUP BY prueba ORDER BY min(orden);
