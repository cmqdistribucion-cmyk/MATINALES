# Instrucciones de Despliegue en Netlify

El proyecto está configurado con TanStack Start y construido exitosamente. Aquí están las instrucciones para desplegar en Netlify:

## Opción 1: Despliegue Manual en Netlify

1. **Preparar el repositorio:**
   - Asegúrate de que el código esté en un repositorio Git (GitHub, GitLab, etc.)
   - El archivo `netlify.toml` ya está configurado

2. **Configurar variables de entorno en Netlify:**
   - Ve a tu dashboard de Netlify
   - En Settings > Environment variables, agrega:
     ```
     VITE_SUPABASE_PROJECT_ID = tkeqehxftduaylqbncjt
     VITE_SUPABASE_PUBLISHABLE_KEY = sb_publishable_sqwWGQNdXwLxLCn2kUQLAg_hfZ9Ekbv
     VITE_SUPABASE_URL = https://tkeqehxftduaylqbncjt.supabase.co
     ```

3. **Conectar tu repositorio:**
   - En Netlify, crea un nuevo sitio
   - Conecta tu repositorio Git
   - Netlify detectará automáticamente la configuración desde `netlify.toml`

4. **Configuración de build:**
   - Build command: `npm run build`
   - Publish directory: `.output/public`
   - Node version: 20

## Opción 2: Despliegue vía Netlify CLI

1. **Instalar Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Iniciar sesión:**
   ```bash
   netlify login
   ```

3. **Inicializar el proyecto:**
   ```bash
   netlify init
   ```

4. **Desplegar:**
   ```bash
   netlify deploy --prod
   ```

## Notas Importantes

- El proyecto usa TanStack Start con SSR configurado para Cloudflare Workers por defecto
- El build actual genera archivos en `.output/public` que son compatibles con Netlify
- Las variables de entorno de Supabase ya están configuradas en `netlify.toml`
- Los redirecciones SPA están configuradas para manejar el routing del cliente

## Estructura del Build

Después de ejecutar `npm run build`, se generan:
- `.output/public/` - Archivos estáticos para desplegar
- `.output/server/` - Archivos del servidor (si se usa SSR)
- La aplicación funciona como SPA con routing del cliente

## Verificación Local

Para verificar el build localmente:
```bash
npm run build
npm run preview
```

Luego abre `http://localhost:4173` para verificar que todo funciona correctamente antes del despliegue.
