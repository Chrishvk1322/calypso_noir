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
- **Despliegue:** Docker & Docker Compose en VPS Linux (Nginx) + Github Actions (dejarlo para las fases finales)

---

## Reglas de Arquitectura & Código
- Todo el código debe estar estrictamente en TypeScript.
- Usar la Local API de Payload dentro de Next.js (`payload.find()`) para consultas del servidor.
- Las imágenes de productos deben optimizarse localmente mediante `sharp`.
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
  - Menú de navegación con los botones: `Home`, `Catálogo`, `Sobre mí`, `Contacto`.
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
- Enlaces sociales dinámicos: TikTok e Instagram.
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
- `description`: RichText / Text
- `images`: Media Upload (hasMany)
- `collection`: Relation -> `Collections` (Required)
- `active`: Boolean (Default: true)

### 3. `Orders` (Colección de Payload)
- `orderCode`: Text (Required, ej: `#PED-9204`)
- `customerName`: Text (Optional)
- `customerPhone`: Text (Optional)
- `items`: Array (Producto, Cantidad, Precio Unitario)
- `totalAmount`: Number (Required)
- `status`: Select (`pending`, `confirmed`, `delivered`, `cancelled`)

### 4. `HeroSlides` (Colección de Payload)
- `title`: Text
- `subtitle`: Text
- `image`: Media (Upload)
- `collectionLink`: Relation -> `Collections`
- `order`: Number

### 5. `SiteConfig` (Global en Payload CMS)
- `contactEmail`: Text
- `whatsappMessageTemplate`: Text (Ejemplo: *"¡Hola! Realicé mi pedido {orderCode} por un total de S/.{totalAmount}. Adjunto comprobante de pago."*)
- `customDesignWhatsappMessage`: Text (Mensaje predeterminado para el botón de diseños personalizados)
- `tiktokUrl`: Text
- `instagramUrl`: Text
- `aboutUsText`: RichText / Text
- `aboutUsPhotos`: Media (hasMany)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
