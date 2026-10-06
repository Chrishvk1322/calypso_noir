# Specification & Guidelines: Tienda Virtual 'Calypso Noir'

## Visión General del Proyecto
Catálogo comercial y tienda virtual altamente optimizada para **Calypso Noir**, enfocada en la venta de productos hechos a base de arcilla polimérica organizados por colecciones, con gestión de existencias y flujo de pedidos validados mediante un código único enviado a WhatsApp.

---

## Stack Tecnológico
- **Frontend / Framework:** Next.js 16 (App Router) + TypeScript
- **CMS / Backend Admin:** Payload CMS 3.0 (ubicado en `/admin`)
- **Base de Datos:** PostgreSQL local vía `@payloadcms/db-postgres`
- **Estilos & UI:** Tailwind CSS + `shadcn/ui` + Lucide Icons
- **Gestión de Estado (Cliente):** Zustand (Carrito con persistencia en `localStorage`)
- **Procesamiento de Imágenes:** `sharp` (optimización nativa local)
- **Despliegue:** Docker + GitHub Actions (CI y build de la imagen en `ghcr.io`) + Coolify en el VPS (proxy Traefik con HTTPS; dominio `calypsonoir.com` detrás de Cloudflare). La demo de Azure usa Docker Compose + Nginx.

---

## Reglas de Arquitectura & Código
- Todo el código debe estar estrictamente en TypeScript.
- Usar la Local API de Payload dentro de Next.js (`payload.find()`) para consultas del servidor.
- Las imágenes de productos deben optimizarse localmente mediante `sharp`.
  - Original en WebP (calidad 80, máx. 2000px; `next/image` lo reduce para cada pantalla) + tamaños `thumbnail`, `card` y `og` (JPG). Sin tamaño `hero`: carrusel y portada de colección usan el original.
  - Los recortes hechos en el admin también se convierten y reducen (hook `normalizeOriginal`, Payload no lo hace solo).
  - Al borrar un producto se borran sus imágenes si nada más las usa (otro producto, portada de colección, slide o fotos de "Sobre mí").
- Mantener la separación de componentes de UI (`/components/ui`) y componentes de negocio (`/components/shop`).

---

## Identidad Visual y Paleta de Colores
- **Fondo principal:** `#FEFFEE` (Crema / Off-white muy claro)
- **Color Primario / Texto:** `#000000` / `#111111` (Negro del logo)
- **Acentos / Variantes de Botones:** 
  - Primario: Negro sólido con texto claro/blanco.
  - Secundario / Hover: Gris oscuro / Charcoal (`#222222`).
  - Botón sobresaliente WhatsApp/Personalizados: Verde esmeralda o Menta oscuro elegante sobre fondo claro.
- **Logo:** `calypso.jpg` (se debe mover a `/public/assets/logo.jpg`).

---

## PRUEBAS

### 1. Pruebas para el frontend
- **Para probar el frontend se usará la skill de playwright instalada

### 2. Pruebas para el backend
- **Para probar el backend se usará vitest

---

## Especificaciones del Frontend

### 1. Navegación y Responsividad
- **Header Superior (Sticky & Responsive):**
  - Muestra el Logo (`/public/assets/logo.jpg`) y el nombre de la tienda: **Calypso Noir**.
  - Enlace directo al Carrito (con badge indicador de cantidad de ítems).
  - Menú de navegación con los botones: `Home`, `Catálogo`, `Accesorios`, `Sobre mí`, `Contacto`. "Accesorios" despliega (al pasar el mouse, con clic o teclado) los `AccessoryTypes` activos y lleva a `/accesorios/[slug]`; no aparece si no hay tipos.
  - Menú desplegable tipo *Drawer / Hamburger* en dispositivos móviles.

### 2. Vista Principal (`Home`)
- **Hero Carousel:**
  - Carrusel interactivo administrable desde Payload CMS (hasta 3 imágenes con texto personalizable).
  - Cada slide incluye un botón *"Ver colección"* que redirige al apartado de la colección correspondiente.
- **Feed de Colecciones:**
  - Listado de colecciones ordenadas desde la más reciente a la más antigua.
  - Paginación de colecciones (10 colecciones por página).
  - Cada colección listada debe mostrar una vista previa con **4 de sus productos más recientes**.

### 3. Vista de Detalle del Producto (`/productos/[slug]`)
- Galería de imágenes del producto.
- Título, descripción enriquecida, precio unitario y control de stock disponible.
- Selector de cantidad con validación contra el stock actual.
- Botón *"Agregar al Carrito"*.
- Metadatos dinámicos OpenGraph (para previsualizaciones al compartir enlace).

### 3b. Filtros de listados
- En `/colecciones/[slug]`, `/accesorios/[slug]` y la sección Productos de `/buscar`: check **"Oferta"** y select **"Ordenar por"** (Más recientes, Precio: Mayor a menor, Precio: Menor a mayor, Nombre: A - Z, Nombre: Z - A). Viven en la URL (`?oferta=1&orden=precio-asc`) y la paginación los conserva.

### 4. Carrito de Compras & Flujo WhatsApp
- Carrito lateral/modal administrado con Zustand.
- Cálculo automático del subtotal y total del pedido.
- Botón *"Completar compra por WhatsApp"*:
  1. Realiza una petición `POST` a la API `/api/orders`.
  2. La API valida stock, registra el pedido en PostgreSQL y genera un código único de compra (ej: `#PED-8492`).
  3. Construye la URL de WhatsApp aplicando la plantilla de mensaje configurada en Payload CMS.
  4. Redirige al cliente a WhatsApp con la información y el código para coordinar el pago.
  5. El pedido también debe ser gestionado en el CMS backend para tener control total y validar el pago y actualizar stock mediante una lógica que implique que se vendió el producto.

### 5. Footer (Pie de Página)
- Texto fijo: *"Enviamos a todo el Perú"*.
- Correo de contacto editable desde las configuraciones de Payload CMS.
- Enlaces sociales dinámicos: Instagram, TikTok y Pinterest (solo los que tengan URL en `SiteConfig`).
- **Botón sobresaliente:** *"¿Deseas un diseño personalizado?"* (Abre chat directo a WhatsApp con mensaje predeterminado para pedidos a medida).

---

## Especificaciones de Colecciones y Modelos (Payload CMS)

### 1. `Collections` (Colección de Payload)
- `title`: Text (Required)
- `slug`: Text (Required, autogenerado, indexado)
- `description`: Text
- `coverImage`: Media (Upload)
- `active`: Boolean (Default: true)

### 2. `Products` (Colección de Payload)
- `name`: Text (Required)
- `slug`: Text (Required, autogenerado, indexado)
- `price`: Number (Required)
- `stock`: Number (Required, default: 0)
- `onSale`: Boolean (Default: false) y `salePrice`: Number (precio final de oferta; obligatorio y menor que `price` si `onSale`). En la tienda: precio anterior tachado, precio de oferta destacado y etiqueta "En oferta" en la imagen ("Agotado" tiene prioridad). El checkout cobra el precio de oferta.
- `effectivePrice`: Number (oculto, lo calcula un hook: precio que se cobra; sirve para ordenar por precio)
- `sortName`: Text (oculto, lo calcula un hook: nombre en minúsculas y sin tildes; sirve para ordenar por nombre igual en cualquier servidor)
- `description`: RichText / Text
- `images`: Media Upload (hasMany)
- `collection`: Relation -> `Collections` (Required)
- `accessoryType`: Relation -> `AccessoryTypes` (obligatorio al crear desde el admin y no se puede quitar; los productos anteriores sin tipo siguen funcionando)
- `active`: Boolean (Default: true)

### 3. `Orders` (Colección de Payload)
- `orderCode`: Text (Required, ej: `#PED-9204`, aleatorio y único)
- `customerName`: Text (Required, lo pide el carrito)
- `customerPhone`: Text (Required, lo pide el carrito)
- `items`: Array (Producto, Cantidad, Precio Unitario)
- `totalAmount`: Number (Required)
- `status`: Select (`pending` = Pendiente, `completed` = Finalizado)
- `completedAt`: Date (fecha de venta, se registra al confirmar)
- Acciones en el admin (con modal de confirmación): **Confirmar** (pendiente → finalizado, descuenta stock), **Cancelar pedido** (elimina un pedido pendiente), **Anular confirmación** (finalizado → pendiente, repone stock) y **Emitir boleta de compra** (PDF, solo finalizados).

### 4. `AccessoryTypes` (Colección de Payload, "Tipos de accesorio")
- `title`: Text (Required)
- `slug`: Text (autogenerado, único)
- `order`: Number (orden en el menú; empate por nombre)
- `active`: Boolean (Default: true)

### 5. `HeroSlides` (Colección de Payload)
- `title`: Text
- `subtitle`: Text
- `image`: Media (Upload)
- `collectionLink`: Relation -> `Collections`
- `order`: Number

### 6. `SiteConfig` (Global en Payload CMS)
- `announcementEnabled` / `announcementText` (máx. 100) / `announcementLink`: barra de anuncio sobre el carrusel de la Home (check de visibilidad; enlace interno `/…` o `https://…`)
- `contactEmail`: Text
- `whatsappMessageTemplate`: Text (Ejemplo: *"¡Hola! Realicé mi pedido {orderCode} por un total de S/.{totalAmount}. Adjunto comprobante de pago."*)
- `customDesignWhatsappMessage`: Text (Mensaje predeterminado para el botón de diseños personalizados)
- `tiktokUrl`: Text
- `instagramUrl`: Text
- `pinterestUrl`: Text (ícono en el footer y en /contacto)
- `aboutUsText`: RichText / Text
- `aboutUsPhotos`: Media (hasMany)

---

## Despliegue y Migraciones de Base de Datos

### 1. Cómo evoluciona el esquema
- **Desarrollo local:** Payload usa *push* (sincroniza las tablas solo al arrancar `pnpm dev`). No deja registro y puede borrar columnas: sirve solo en local.
- **Producción:** **nunca** push ni copiar la base local (`pg_dump`/`pg_restore` de dev reemplazaría pedidos, stock y contenido reales). El esquema cambia **solo con migraciones de Payload** versionadas en `src/migrations/` (generadas con `pnpm payload migrate:create <nombre>`, con `up` y `down`, registradas en la tabla `payload_migrations`).
- **Regla:** todo cambio de campos/colecciones/globals que se commitee debe ir acompañado de su migración generada. Revisar el SQL generado antes de commitear (que no haga `DROP` de datos sin querer; un renombre se escribe a mano como `RENAME`).
- **Imágenes previas a la optimización:** las bases creadas antes de quitar el tamaño `hero` necesitan `pnpm media:optimize` (borra archivos y columnas `sizes_hero_*`, convierte a WebP los recortes en JPEG; idempotente). En la imagen standalone no hay CLI: en la Fase 9 este paso va dentro de una migración o se ejecuta desde un contenedor con el código completo.
- **Datos calculados:** si una migración agrega campos derivados (como `effectivePrice` / `sortName`), el relleno de los registros existentes va dentro de la propia migración o se documenta su script (hoy `pnpm backfill:products`, que no toca `updatedAt`).

### 2. Migración inicial (baseline)
- `src/migrations/20261006_061451_initial.ts` contiene el esquema completo (Fases 0–8 + optimización de imágenes). Un servidor vacío la aplica y queda con todas las tablas.
- En bases que ya tienen ese esquema se marca como aplicada sin ejecutarla (insertar su fila en `payload_migrations` con `batch = 1`), sin borrar ni recrear nada. Hecho en la base dev local; la demo de Azure no está marcada.
- Nuevas migraciones: `pnpm payload migrate:create <nombre>` (actualiza `src/migrations/index.ts`); después se marca como aplicada en la base dev, porque ahí el esquema ya lo aplicó el push.

### 3. Requisitos para el Dockerfile / despliegue limpio
- La imagen es `output: 'standalone'` y **no incluye el CLI de Payload**: las migraciones se aplican al iniciar la app con `prodMigrations` del adaptador (`postgresAdapter({ prodMigrations: migrations })` importando `src/migrations/index.ts`). Así el contenedor nunca arranca con un esquema desactualizado y no hace falta un paso manual.
- El build no consulta la base (páginas dinámicas): usa `PAYLOAD_SECRET`/`DATABASE_URL` ficticios. Variables de build: `NEXT_PUBLIC_SERVER_URL` y `DISALLOW_INDEXING` (`1` solo en la demo; `0` en producción para que Google indexe).
- Secretos en runtime (`.env` del servidor / secrets de GitHub), nunca en la imagen ni en git: `DATABASE_URL`, `PAYLOAD_SECRET`, `POSTGRES_PASSWORD` y los del adaptador de correo.
- Correo (recuperar contraseña del admin): `@payloadcms/email-nodemailer` con SMTP de Gmail y una contraseña de aplicación. Variables en Coolify: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER`, `SMTP_PASS` (secreta), `SMTP_FROM` (la misma cuenta de Gmail). Sin `SMTP_HOST` (desarrollo, pruebas) Payload escribe los correos en consola.
- Persistencia fuera del contenedor: volumen de PostgreSQL y carpeta `media/` (montada en `/app/media`, dueño uid 1001). Ambos entran en los backups programados.
- La app corre como usuario no root, solo es accesible a través del proxy (Traefik de Coolify en producción, Nginx en la demo), que termina HTTPS, con rate limiting en `/api/orders` y `/api/search`.
- Rate limiting y redirección `www` → dominio con 301: archivo de Traefik en el VPS `/data/coolify/proxy/dynamic/calypso-extra.yaml` (fuera del repo; Traefik lo recarga solo). `POST /api/orders`: 10/min, ráfaga 5; `/api/search`: 60/min, ráfaga 20; por IP real (`CF-Connecting-IP`, el dominio va detrás de Cloudflare). Usa los servicios `https-0/1-<uuid de la app>@docker` que genera Coolify: si se recrea la app en Coolify, actualizar ese uuid.
- Backups (solo en el VPS por ahora): base de datos con los Scheduled Backups de Coolify (diario 03:00 Perú, 14 copias) y `media/` con `/usr/local/bin/calypso-media-backup.sh` vía `/etc/cron.d/calypso-media-backup` (diario 03:15 Perú → `/root/backups/media`, 14 días).
- Chequeo de salud: `GET /api/health` (consulta la base; 200 u 503). Lo usan el `HEALTHCHECK` del Dockerfile y Coolify.
- **CI/CD** (`.github/workflows/deploy.yml`): en cada PR, lint + typecheck + Vitest (con PostgreSQL de servicio). En push a `main`: lo anterior → imagen `ghcr.io/chrishvk1322/calypso_noir:latest` y `:<sha>` → llamada al Deploy Webhook de Coolify, que descarga la imagen y la despliega. El VPS nunca compila (el build de Next necesita varios GB de RAM). Configuración del repo: variable `NEXT_PUBLIC_SERVER_URL` y secretos `COOLIFY_WEBHOOK` / `COOLIFY_TOKEN`.
- Volver a una versión anterior: en Coolify, cambiar la etiqueta de la imagen al `<sha>` deseado y redesplegar (si esa versión es anterior a una migración, restaurar también el backup de la base).
- Orden de un despliegue: backup de la base → pull de la imagen → arranque (aplica migraciones pendientes) → verificación de salud. Si una migración falla, la app no arranca y se restaura el backup / se vuelve a la imagen anterior.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
