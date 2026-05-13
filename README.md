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

## Edge Functions de Supabase

El proyecto incluye Edge Functions desplegadas en Supabase:

- `send-email`: Envía correos electrónicos usando la API de **Resend**.

### Configuración de Secrets

Para que la función `send-email` funcione, debes configurar los siguientes secrets en Supabase:

```bash
npx supabase secrets set RESEND_API_KEY=re_tu_api_key_de_resend
npx supabase secrets set RESEND_FROM_EMAIL=onboarding@resend.dev
```

> **Nota:** El email debe estar verificado en tu cuenta de Resend. Para pruebas, puedes usar `onboarding@resend.dev`.

## Despliegue

La aplicación se despliega automáticamente mediante GitHub Actions al hacer merge en la rama `main`.
La infraestructura utiliza Supabase para base de datos y autenticación.
