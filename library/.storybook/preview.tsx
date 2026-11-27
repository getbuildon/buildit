import type { Preview } from "@storybook/react-vite"
import { installFocusModality } from "../foundations/focus/modality"
import "./storybook.css"

installFocusModality()

export type ThemeMode = "claro" | "oscuro" | "sistema"

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Modo de color",
      toolbar: {
        title: "Modo",
        icon: "contrast",
        items: [
          { value: "claro", title: "Claro", icon: "sun" },
          { value: "oscuro", title: "Oscuro", icon: "moon" },
          { value: "sistema", title: "Sistema", icon: "browser" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "claro",
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as ThemeMode | undefined) ?? "claro"
      // Se marca antes de renderizar, así las muestras leen los colores del modo elegido.
      document.documentElement.dataset.theme = theme
      // key: al cambiar de modo se vuelve a montar la historia y se releen los colores.
      return (
        <div key={theme}>
          <Story />
        </div>
      )
    },
  ],
  parameters: {
    layout: "fullscreen",
    options: {
      storySort: {
        order: [
          "Foundations",
          [
            "Introducción",
            "Color",
            ["Roles", "Estados", "Funcionales", "Tonos", "Rampas", "Contraste", "Cruce"],
            "Tipografía",
            ["Voces", "Roles", "Reglas"],
            "Spacing",
            "Size",
            "Radio",
            "Stroke",
            "Elevación",
            "Focus",
            "Motion",
            "Stacking",
            "Grilla",
            "Iconografía",
            "Formato",
          ],
          "Átomos",
          ["Auditoría", "Button", "IconButton", "Input", "Label", "Checkbox", "Radio", "Switch", "Badge", "Tag", "Avatar", "Progress", "Spinner", "Tooltip", "Link"],
          "Moléculas",
          ["Auditoría", "Field", "InputGroup", "CodeField", "Select", "Combobox", "DatePicker", "InlineEdit", "FileField", "Dialog", "Menu", "Tabs", "Notice", "Card"],
          "Organismos",
          ["Auditoría", "Sidebar", "PageHeader", "ListToolbar", "DataTable", "Metric", "ProjectCard", "Avance por piso", "Wizard", "FormSection", "Gráficos", "Plano por piso"],
          "Estructuras",
          "Pantallas",
          ["Acceso", "Inicio", "Obra", ["Resumen", ["Como hoy", "Como hoy · cargando", "Como hoy · error", "Propuesta"], "Trabajo diario", ["Como hoy", "Como hoy · cargando", "Como hoy · sin trabajos", "Propuesta"], "Cargar avance", ["Como hoy", "Propuesta"], "Detalle de trabajo", ["Como hoy", "Como hoy · editando", "Como hoy · sin permiso para certificar", "Propuesta"], "Certificaciones", ["Como hoy", "Como hoy · sin permiso para certificar", "Como hoy · sin pendientes", "Propuesta"], "Equipo", ["Como hoy", "Como hoy · agregando (límite del plan)", "Propuesta"], "Clientes", ["Como hoy", "Como hoy · agregando", "Como hoy · sin clientes", "Propuesta"], "Configuración", ["Como hoy", "Como hoy · superficie sobre el plan", "Propuesta"], "Portal Clientes", ["Editor · como hoy", "Editor · como hoy · con errores", "Editor · propuesta", "Mi Unidad (cliente) · como hoy", "Mi Unidad (cliente) · propuesta"]], "Crear obra", ["Como hoy · etapa", "Como hoy · información básica", "Como hoy · estado actual", "Como hoy · equipo", "Propuesta"], "Mi perfil", ["Como hoy", "Como hoy · con errores", "Propuesta"], "Backoffice", ["Como hoy", ["Dashboard", "Clientes", "Usuarios", "Empresas", "Proyectos"], "Propuesta", ["Resumen", "Cobranzas", "Obras y suscripciones", "Empresas", "Usuarios"]], "Ejemplos", ["Obra · Unidades"]],
        ],
      },
    },
  },
}

export default preview
