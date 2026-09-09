-- Completa la descripción de hitos default ya existentes (solo si está vacía).

UPDATE public.project_portal_milestones AS m
SET
  description = d.description,
  updated_at = now()
FROM (
  VALUES
    (
      'inicio de obra',
      'Trabajos preliminares; replanteo, movimiento de suelo, instalaciones esenciales.'
    ),
    (
      'estructura resistente',
      'Se ejecutan fundaciones, estructuras verticales y horizontales.'
    ),
    (
      'instalaciones',
      'Se instalan las redes sanitarias, eléctricas, corrientes débiles y demás servicios.'
    ),
    (
      'terminaciones',
      'Se completan revestimientos, carpinterías, pisos, pintura y detalles finales.'
    ),
    (
      'puesta a punto',
      'Se realizan controles, pruebas y ajustes para asegurar el correcto funcionamiento.'
    ),
    (
      'entrega de la unidad',
      'Finalización de la obra y preparación para la entrega al propietario.'
    )
) AS d(name_key, description)
WHERE lower(btrim(m.name)) = d.name_key
  AND btrim(coalesce(m.description, '')) = '';
