---
name: agentes personalizados
description: Guía y formato para la creación y uso de Agentes Personalizados en Antigravity.
---

# Agentes Personalizados en Antigravity

Esta habilidad documenta el formato, ubicación y uso de los archivos de agentes personalizados basándose en la documentación oficial.

## 1. ¿Dónde se guardan los archivos de Agentes?

Los agentes personalizados se definen como archivos Markdown (`.md`) y se pueden guardar en dos ubicaciones:

* **Nivel de Proyecto (Local Workspace)**: `.agents/agents/<nombre-del-agente>.md`
  * _Nota: Al hacer commit de estos archivos, estarán disponibles para todos los miembros del equipo que compartan el repositorio._
* **Nivel de Usuario (Global)**: `~/.gemini/config/agents/<nombre-del-agente>.md`

## 2. Formato y Campos del Archivo de Agente

El archivo se compone de una cabecera YAML Frontmatter (entre delimitadores `---`) y un cuerpo Markdown para las instrucciones del sistema.

### Campos YAML (Frontmatter)
* `name`: *(String)* Identificador único del agente (ej. `dependency-modernizer`).
* `description`: *(String)* Descripción del propósito del agente. Usado por el agente principal para delegar tareas.
* `model`: *(String)* Modelo de LLM a utilizar (ej. `flash`).
* `tools`: *(List of Strings)* Lista de herramientas habilitadas (ej. `view_file`, `replace_file_content`, `manage_task`, `run_command`).
* `mainAgent`: *(Boolean)* Si es `true`, el agente puede lanzarse directamente como agente principal en chat o CLI.
* `subagent`: *(Boolean)* Si es `true`, el agente puede ser invocado dinámicamente como subagente por otros agentes.
* `permissionMode`: *(String)* Define el nivel de permisos para operaciones (ej. `acceptEdits`, `bypassPermissions`).
* `commandExecutionPolicy`: *(String)* Política de seguridad de ejecución de comandos (ej. `auto`).
* `skills`: *(List of Strings)* Lista de rutas/identificadores de skills disponibles para el agente (ej. `skills/package-upgrade-rules`).

### Cuerpo Markdown
* Contiene `# Core Instructions` y las pautas que se compilarán directamente en el prompt del sistema del agente.

### Ejemplo de Configuración
```markdown
---
name: dependency-modernizer
description: Ayuda a actualizar dependencias locales y verifica que los tests pasen.
model: flash
mainAgent: true
subagent: true
permissionMode: acceptEdits
commandExecutionPolicy: auto
tools:
  - view_file
  - replace_file_content
  - manage_task
  - run_command
skills:
  - skills/package-upgrade-rules
---

# Core Instructions
Eres un modernizador de dependencias. Tu trabajo es revisar archivos de configuración,
actualizar dependencias, ejecutar pruebas y verificar que el build pase.
```

## 3. ¿Cómo se invocan los Agentes?

* **Como Agente Principal (Main Agent)**:
  * **GUI**: Seleccionándolo directamente desde el menú de agentes en la aplicación de escritorio Antigravity 2.0.
  * **CLI**: A través de terminal usando el comando: `agy --agent <nombre-del-agente>`
* **Como Subagente (Subagent)**:
  * Invocado dinámicamente como una herramienta por un agente coordinador o principal durante una sesión, basándose en el contexto de la tarea y la descripción (`description`) del agente.
