# Guía para Agentes de IA (AGENTS.md)

Este archivo proporciona contexto técnico para agentes de IA que asisten en el desarrollo de este proyecto.

## Arquitectura y Stack Tecnológico
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Herramientas de Construcción**: Vite para empaquetado y servidor de desarrollo.
- **Backend / BaaS**: Supabase (Autenticación, Base de datos PostgreSQL, Storage).
- **Pruebas**: Vitest y DOM Testing Library.
- **Linting & Formateo**: ESLint + Prettier.
- **Iconos**: Lucide Icons.

## Patrones y Convenciones
- **CSS**: Utiliza clases utilitarias inspiradas en TailwindCSS pero implementadas en Vanilla CSS para lograr una estética premium ("glassmorphism", colores vibrantes, animaciones fluidas).
- **Módulos JS**: El proyecto está en transición hacia un enfoque modular. Nuevas funcionalidades deben implementarse en módulos independientes bajo el directorio `src/`.
- **Estado**: El estado global de la aplicación se maneja mediante el objeto `appState` e interacciones del DOM.

## Flujo de Trabajo
1. Instalar dependencias con `npm install`.
2. Utilizar `npm run dev` para previsualizar los cambios locales.
3. Asegurarse de ejecutar `npm run lint` y `npm run test` antes de completar cualquier tarea.
4. Toda modificación en la estructura del proyecto debe quedar reflejada en el `vite.config.js`.
