# Librería BuildOn

Design system de BuildOn, alineado al criterio de la librería de Rootsy
(`rootsy-teams/library`) pero con el stack de esta app: Tailwind 4 y Radix.

**Estado:** las cinco capas: foundations, átomos, moléculas, organismos y estructuras de página. La app la usa en convivencia desde
2026-11-25 (paso 1 de "Adoptarla en la app"): `app/globals.css` importa los tokens y `foundations/roles.css`, y las pantallas se pasan
de a una. Ya pasaron: ingresar (equipo y clientes), recuperar contraseña (`components/acceso/`), inicio (`components/inicio/`) y, en la obra, el marco (menú y barra del celular) y el Dashboard (`components/obra/`).

## Ver el catálogo

```bash
npm run library
```

Abre Storybook en http://localhost:6006. `npm run library:build` genera la versión
estática en `library/storybook-static/` (ignorada por git).

## Estructura

```
library/
  foundations/
    theme.css            Modo estricto (Storybook): tokens + strict.css + roles.css
    roles.css            Los roles como utilidades; es lo que importa la app en convivencia
    strict.css           Borra la paleta y las escalas por defecto de Tailwind
    tokens/primitives.css  Rampas crudas (--buildon-<rampa>-<paso>)
    tokens/tokens.css      Tipografía, spacing, size, elevación, motion, z, grilla
    format/format.ts       Plata, números, %, m² y fechas (es-AR, Buenos Aires)
    docs/                  Piezas para documentar en Storybook
    <foundation>/*.stories.tsx
  atoms/                 Átomos (Radix + cva + roles): ver abajo
    Auditoria.stories.tsx  Qué tiene hoy la app y qué resuelve cada átomo
  molecules/             Moléculas: combinan átomos (ver abajo)
  organisms/             Organismos: bloques de pantalla (ver abajo)
  layouts/               Estructuras de página y pantallas de ejemplo (ver abajo)
  lib/cn.ts              Une clases y conoce los roles (ver abajo)
  .storybook/            Config de Storybook (Vite + @tailwindcss/vite)
```

Capas que vienen después, igual que en Rootsy: `atoms`, `molecules`, `organisms`,
`layouts`, `pages`.

## Reglas

- **Se pide el oficio.** `bg-action`, `text-ink-muted`, `p-group`, `rounded-control`,
  `shadow-overlay`, `text-body`. Nunca un hex, un px suelto ni un paso de rampa.
- **Solo existen los roles.** `theme.css` borra la paleta y las escalas por defecto de
  Tailwind (`--color-*: initial`, `--text-*`, `--radius-*`, `--shadow-*`, `--font-*`,
  `--ease-*`, `--container-*`). `bg-slate-500`, `text-sm` o `rounded-lg` no generan CSS.
  Se mantienen la escala numérica de spacing (para medidas de layout) y los breakpoints.
- **Lo que no tiene utilidad propia se pide por variable:** `z-(--z-overlay)`,
  `duration-(--duration-base)`.
- **Nace del relevamiento** del 2026-11-18: los valores salen de lo que la app ya usa.

## Relevamiento (2026-11-18)

| Qué | Hoy en la app | En la librería |
| --- | --- | --- |
| Colores | 154 hex distintos, ~2.150 usos escritos a mano | 7 rampas + roles en pares claro/oscuro + 8 tonos |
| Tamaños de texto | 24 tamaños en px + 9 de Tailwind | 10 roles |
| Radios | 10 valores (4 a 40 px) | 4 roles |
| Alturas de control | 32, 35, 36, 40, 41, 42, 44, 45, 46 | 36, 44, 52 |
| Sombras | más de 15 | 5 niveles |
| z-index | 0, 1, 2, 3, 4, 10, 20, 30, 40, 50, 9999 | 6 capas |
| Trazo de íconos | 1, 1.25, 1.33, 1.5, 1.75, 2, 2.5 | 1.75 |
| Espaciados en px sueltos | ~150 | 7 oficios |


## Átomos

`Button`, `IconButton`, `Input`, `Textarea`, `Label`, `Checkbox`, `RadioGroup`/`RadioItem`,
`Switch`, `Badge`, `Tag`, `Avatar`, `Progress`, `Spinner`, `Skeleton`, `Tooltip`, `Link`,
`Separator`, `Icon`, `VisuallyHidden`. Se exportan desde `atoms/index.ts`.

- Radix para todo lo interactivo (casilla, radio, switch, tooltip, avatar, progreso).
- Variantes con `cva`, mismos nombres que Rootsy (`action`, `outline`, `ghost`, `danger`).
- Accesibles por diseño: `IconButton` no compila sin `label`; foco visible en todos;
  objetivos tocables de 24 a 44 px; textos para lector de pantalla en español.
- Verificados con axe (WCAG 2.2 AA) en claro y oscuro: 0 problemas.
- La auditoría de la app (qué hay hoy, qué está bien y qué se arregla) está en
  Storybook: **Átomos → Auditoría**.

### `cn` (lib/cn.ts)

Une clases con `tailwind-merge` configurado con los roles de la librería. Sin esa
configuración, `tailwind-merge` confunde `text-body` (tamaño) con `text-ink` (color)
y borra uno. Al adoptar la librería, el `cn` de la app (`lib/utils.ts`) pasa a ser este.

## Moléculas

`Field`, `InputGroup`, `Select`, `Dialog`, `ConfirmDialog`, `Popover`, `Menu`, `Tabs`,
`Segmented`, `Notice`, `Toast` (`ToastProvider` + `useToast`), `Card`, `EmptyState`,
`Accordion`, `Calendar`, `DatePicker`, `DateRangePicker`, `Combobox`, `InlineEdit`, `FileField`. Se exportan desde `molecules/index.ts`.

- Errores de formulario escritos y conectados al campo (`Field`), no en un tooltip.
- Diálogos con foco encerrado, Escape y vuelta del foco; en el celular suben desde abajo.
- Confirmaciones con verbo, tono `danger`, foco en Cancelar y espera si la acción es async.
- Fechas que se escriben o se eligen (con límites y atajos de período); búsqueda sin tildes
  para listas largas (`cmdk`); edición en el lugar con guardado async; un solo campo de
  subida con validación en español y cámara en el celular (comprimir y subir quedan en la app).
- La auditoría de la app está en Storybook: **Moléculas → Auditoría**.
- Verificado con axe (WCAG 2.2 AA) en claro y oscuro: el catálogo entero, 0 problemas.

## Organismos

`Sidebar` (+ `SidebarSection`, `SidebarItem`), `Sheet`, `PageHeader` (+ `BackLink`),
`ListToolbar`, `DataTable`, `MetricCard` / `MetricStrip`, `ProjectCard`, `Stepper` +
`WizardFooter`, `FormSection` + `FormActions`, `Topbar`, `BarChart`, `DonutChart`,
`ProgressCurve` (curva de avance), `FloorPlan` + `FloorPlanCell` (plano por piso),
`FloorList` + `FloorItem` + `UnitTile` (avance por piso del resumen de la obra). Se exportan desde `organisms/index.ts`.

- `DataTable`: tabla de verdad (hoy la app tiene una sola `<table>`), orden natural en
  español, selección con barra de acciones, acciones por fila, carga y vacío.
- `Sidebar`: el menú de la obra (claro) y el del backoffice (oscuro) son el mismo
  componente; el oscuro es una isla con `data-theme="oscuro"`. En el celular, en un `Sheet`.
  Dos variantes: `flush` (pegado al borde, 220 px) y `floating` (el de hoy en la obra:
  panel de 254 px con radio 24 y sombra difusa).
- `MetricCard`: variante `tile` (la de hoy en el resumen: ícono en un cuadrado de color
  al lado del dato).
- `Progress`: tonos `stage` y `stage-neutral`, la regla de color por etapa de avance que
  usa hoy el resumen de la obra.
- Gráficos sobre Recharts (la misma que usa hoy el panel): colores que pasan 3:1 en los
  dos modos, tabla de datos para el lector de pantalla, ejes abreviados («$ 684 mil»)
  y sin animación si se pidió menos movimiento.
- La auditoría está en Storybook: **Organismos → Auditoría**.

## Estructuras de página

`WorkspaceLayout` (obra, backoffice, empresa), `HomeLayout` (inicio, portal), `AuthLayout`
(acceso), `WizardLayout` (crear obra). Se exportan desde `layouts/index.ts`.

- Solo ubican: tienen lugares (menú, encabezado, contenido), no componentes. Misma regla
  que Rootsy.
- Todas traen «Saltar al contenido» (hoy la app no lo tiene en ninguna pantalla) y un
  `<main id="contenido">`.
- Pantallas completas armadas solo con la librería, en claro y en oscuro, en
  **Pantallas**: Acceso, Inicio y Obra (el resumen en dos versiones: «como hoy», con los
  arreglos de buenas prácticas, y «propuesta»), más ejemplos de unidades, configuración,
  backoffice y crear obra.

## Capturas automáticas (pixel perfect)

```bash
npm run library:snapshots          # compara cada página con su versión aprobada
npm run library:snapshots:update   # aprueba lo actual como nueva referencia
```

Saca una foto de cada página del catálogo en claro y en oscuro (y las pantallas también
en celular) con el Chrome instalado, y la compara píxel por píxel con la aprobada en
`library/snapshots/`. Esa carpeta queda fuera de git (las referencias ocupan ~35 MB):
cada máquina genera las suyas la primera vez con `library:snapshots:update`. Las
diferencias quedan en `library/snapshots/__diff__/` con la zona cambiada marcada. Sin animaciones y esperando las fuentes, para
que la misma página dé siempre la misma foto.

## Modo claro y oscuro

Cada color es un par `light-dark(claro, oscuro)`. El modo lo decide `color-scheme`,
que se pone con `data-theme` en `<html>` o en cualquier contenedor:

| Atributo | Modo |
| --- | --- |
| (ninguno) | claro: lo que ve la app hoy |
| `data-theme="claro"` | claro |
| `data-theme="oscuro"` | oscuro |
| `data-theme="sistema"` | lo que eligió la persona en su equipo |

- Los componentes no cambian entre modos: piden roles.
- En oscuro, lo que está más arriba se aclara (`canvas` → `canvas-raised` →
  `canvas-overlay`) y la sombra pasa a segundo plano. El naranja de marca no cambia.
- `color-scheme` también cambia los controles nativos (scrollbars, calendario).
- `light-dark()` funciona desde Chrome 123, Safari 17.5 y Firefox 120 (2024).
- Para encenderlo en la app falta: guardar la elección de la persona (claro, oscuro,
  sistema), ponerla en `<html>` antes del primer render para que no parpadee, y
  revisar imágenes y logos que asumen fondo claro.

## Decisiones tomadas (2026-11-18, criterio: mejores prácticas + pixel perfect)

1. **Botón principal:** fondo naranja de marca (sin cambios) con tinta marrón oscura
   (`ladrillo-950`): 6:1 en los dos modos. Antes, blanco: 2.7:1.
2. **Texto secundario:** `#696e77` (5:1). El `#777b84` que la app usa mucho no llega a AA.
3. **Placeholder:** `hormigon-550` (`#6f737c`, 4.65:1), un paso entre los dos grises de la
   app. Un placeholder también se lee.
4. **Interlineados en píxeles enteros** (en rem): 14/20, 12/17, 18/25, 24/29, 28/29, 48/50.
   Antes 19.6, 16.8, etc.
5. **Porcentajes con coma** (`45,5%`). La app hoy muestra `45.5%`.
6. **Tonos para categorías y gráficos:** 8 tonos con nombre (se guarda el nombre, no el
   color), con contraste verificado en los dos modos.
7. **Texto verde de estado:** `brote-800` (7:1 sobre su fondo verde). El `#208368` de la
   app da 4,4:1 sobre ese fondo; sigue siendo el verde de los botones y barras.
8. **Segmentado:** todas las opciones en tinta (el gris de hoy da 4,4:1 sobre la pista) y
   radio concéntrico (6 dentro de 10), en vez de 8.
9. **Foco solo con teclado:** `installFocusModality()` (`foundations/focus/modality.ts`)
   se llama una vez al montar la app.

## Pixel perfect

- Medidas en píxeles enteros: radios, alturas, íconos, espacios e interlineados.
- Storybook carga las mismas fuentes y el mismo suavizado (`antialiased`) que la app.
- Capturas automáticas de cada página (ver arriba).
- Pendiente: comparar contra el diseño en Figma (necesita conectar Figma).

## Adoptarla en la app (más adelante)

Para que el cambio quede limpio y sin residuos:

1. **Convivencia.** La app importa los tokens y los roles, pero sin los resets: las
   clases viejas siguen funcionando.
2. **Pantalla por pantalla** se reemplazan hex, px y escalas por roles. La mayoría es
   mecánica (un script que mapea los valores relevados a su rol); lo que se unifica
   (radio 8/12/14 → 10/16, alturas 42/46 → 44, texto 13 → 12/14) cambia un poco a la
   vista y se revisa.
3. **Contador de residuos.** Un chequeo cuenta hex, px sueltos y clases de la paleta
   de Tailwind que quedan en `app/` y `components/`. La meta es 0.
4. **Modo estricto.** Con el contador en 0 se activan los resets en la app: cualquier
   resto deja de compilar a CSS, así que no queda nada escondido. Al final se borran
   las variables viejas de `app/globals.css` y los formateadores de `lib/` que reemplaza
   `format.ts`.
