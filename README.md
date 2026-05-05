# Amaru Fighter Project

Premium Martial Arts Landing Page & App

## Instalación y Configuración Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno:
   Copiar `.env.example` a `.env` y configurar las claves de Supabase.

3. Iniciar el servidor de desarrollo local:
   ```bash
   npm run dev
   ```

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo con Vite.
- `npm run build`: Compila la aplicación para producción en el directorio `dist`.
- `npm run lint`: Analiza el código con ESLint en busca de problemas.
- `npm run test`: Ejecuta las pruebas unitarias e integradas con Vitest.

## Despliegue

La aplicación se despliega automáticamente mediante GitHub Actions al hacer merge en la rama `main`.
La infraestructura utiliza Supabase para base de datos y autenticación.
