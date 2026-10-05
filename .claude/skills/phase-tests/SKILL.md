---
name: phase-tests
description: Ejecuta la batería de pruebas de cierre de una fase de desarrollo de Calypso Noir — backend con Vitest y frontend con la skill playwright-cli — y emite un reporte de aprobado/fallido. Usar al terminar cada fase de la hoja de ruta, o cuando el usuario pida "probar la fase N", "verificar la fase" o "/phase-tests N".
argument-hint: "<número de fase 0-8>"
---

# Pruebas de cierre de fase — Calypso Noir

Definida según el apartado **PRUEBAS** de `CLAUDE.md`:
- **Backend → Vitest.**
- **Frontend → skill `playwright-cli`** (cargarla con la herramienta Skill antes de usar sus comandos).

Argumento: número de fase (`$ARGUMENTS`). Si falta, deducirlo del trabajo recién hecho y confirmarlo en una línea.

Una fase **solo se da por cerrada si todos los pasos aplicables pasan**. Si algo falla: diagnosticar, corregir, y volver a correr la batería completa — no solo el paso que falló.

---

## Paso 1 — Chequeos estáticos (todas las fases desde la 1)

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Cero errores de TypeScript. Advertencias de lint se reportan pero no bloquean.

## Paso 2 — Backend con Vitest

### Convenciones
- Pruebas en `tests/int/**/*.int.spec.ts` (integración con Payload) y `tests/unit/**/*.spec.ts` (lógica pura: `src/lib`, `src/hooks`).
- Configuración: `vitest.config.mts` (entorno `node`, `vite-tsconfig-paths`) + `vitest.setup.ts` que carga `.env.test`.
- **Nunca** usar la BD de desarrollo: las pruebas de integración usan `calypso_test` (`DATABASE_URL` en `.env.test`). Si no existe: `createdb -U postgres calypso_test` (la contraseña está en `.env`, `PGPASSWORD`).
- Integración vía Local API: `const payload = await getPayload({ config })`. Cada archivo limpia lo que crea (`afterAll` con `payload.delete`).
- Script en `package.json`: `test:int` (vitest run con `vitest.config.mts`).

### Ejecutar
```bash
pnpm test:int
```

### Qué debe cubrir cada fase (acumulativo: las pruebas de fases previas deben seguir pasando)

| Fase | Pruebas backend obligatorias |
|------|------------------------------|
| 0–1 | Conexión: `getPayload` inicializa y `payload.find({ collection: 'users' })` responde. |
| 2 | Cada colección/global existe con sus campos requeridos (crear doc válido ok, doc sin campo requerido falla). Slug autogenerado y único (`slugify`). `HeroSlides` rechaza un 4.º documento. Defaults: `active=true`, `stock=0`. Acceso anónimo no lee docs `active=false` ni `Orders`. Media genera los `imageSizes`. |
| 3 | `src/lib/whatsapp.ts`: URL `wa.me` correcta, mensaje codificado, número saneado. |
| 4 | Consultas del feed: orden `-createdAt`, 10 colecciones por página, 4 productos más recientes por colección, excluye inactivos. |
| 5 | Búsqueda por slug de producto; slug inexistente devuelve vacío (→ 404). |
| 6 | `POST /api/orders`: body inválido → 400; cantidad > stock → 409; precios tomados de BD (ignora precio enviado); `orderCode` con formato `#PED-\d{4}` y único; total correcto; plantilla con `{orderCode}`/`{totalAmount}` reemplazados. Estados `pending`/`completed`: `pending→completed` (Confirmar) descuenta y registra `completedAt`; `completed→pending` (Anular confirmación) repone; re-guardar un finalizado no descuenta dos veces; solo se eliminan pedidos pendientes. Boleta PDF (`src/lib/receipt.ts`) válida, tolera emojis y pagina. |
| 7 | Hooks de revalidación no rompen la escritura; `sitemap` lista productos/colecciones activos. |
| 8 | Mejoras (una fila por mejora, ver Fase 8 del plan). **8.1** — sin cambios de backend: basta con que las pruebas 1–7 sigan pasando. **8.2** — `admin-config.int.spec.ts`: toda colección (salvo `payload-*`) y el global tienen `hideAPIURL` y la pestaña "Editar" con `condition` → `false`; toda colección incluye `CancelCreate` en `beforeDocumentControls` y Pedidos conserva `OrderActions` antes. **8.3** — `socials.int.spec.ts`: `SiteConfig.pinterestUrl` se guarda; `socialLinks` filtra vacías y ordena Instagram, TikTok, Pinterest. `socialHandle` extrae el usuario de pinterest.com y devuelve `null` con `pin.it`. **8.4** — `announcement.spec.ts` (`isValidAnnouncementLink`: rutas "/…" y http(s); rechaza "//…", `javascript:`, `mailto:`; `getAnnouncement`: null si desactivada o sin texto, interno/externo) y `announcement.int.spec.ts` (activa exige texto; desactivada sin texto se guarda; >100 caracteres y enlace inválido fallan). **Corrección header** — `scroll.spec.ts`: `scrollToTopIfSameUrl` sube (smooth o auto con movimiento reducido) solo si ruta+query son las actuales y sin ancla; respeta modificadores, botón central y eventos cancelados. **8.5** — solo interfaz: basta con que la búsqueda existente (`search.int.spec.ts`, mínimo 2 letras) siga pasando; `SEARCH_MIN_LENGTH` vive en `src/lib/search.ts`. **8.6** — `pricing.spec.ts` (`getPricing`/`isValidSalePrice`: oferta válida solo si 0 < salePrice < price) y `offers.int.spec.ts` (onSale=false por defecto; salePrice obligatorio y menor que el precio si está en oferta; `effectivePrice` se recalcula al cambiar oferta/precios y se conserva en cambios parciales de stock; consultas y `/api/search` traen la oferta; el checkout cobra y guarda el precio de oferta y vuelve al normal si la oferta termina). `queries.int.spec.ts` espera `onSale` y `salePrice` en la tarjeta. **8.7** — `accessories.int.spec.ts`: slug autogenerado y activo por defecto; el público solo lee tipos activos; `accessoryType` obligatorio al crear con usuario (admin), no se puede quitar una vez asignado, productos anteriores sin tipo se editan y cambian de stock; `getAccessoryTypes` (activos, por `order` y nombre), `getAccessoryTypeBySlug` (null si inactivo o inexistente), `getAccessoryProducts` (solo del tipo, activos, de colecciones activas, paginado); sitemap con `/accesorios/…`. **8.8** — `filters.spec.ts` (`parseFilters` con valores inválidos → por defecto; `filtersToParams`/`filteredHref`; `toPayloadSort`; `toSortName` sin tildes ni mayúsculas), `pagination.spec.ts` (`pageHref` conserva los filtros) y `filters.int.spec.ts` (`sortName` por hook; orden por precio usa el de oferta; por nombre ignora mayúsculas y tildes; "Oferta" filtra y se combina con el orden; paginación estable; mismos filtros en `getAccessoryProducts` y en los productos de `searchCatalog`). |
| 9 | Igual que 1–8 contra el build de producción / contenedor. |

## Paso 3 — Frontend con playwright-cli (desde la fase 3)

1. Asegurar el servidor: si `http://localhost:3000` no responde, iniciar `pnpm dev` en segundo plano y esperar a que responda.
2. Cargar la skill `playwright-cli` y usar una sesión dedicada: `playwright-cli -s=calypso open http://localhost:3000`.
3. Recorrer el checklist de la fase en **escritorio (1440×900)** y en **móvil** (`playwright-cli -s=calypso-m open --device="iPhone 15" ...`).
4. En cada página revisar `playwright-cli console error` — cero errores.
5. Usar `find`/`snapshot` para afirmaciones; `screenshot` solo como evidencia de fallos o de cambios visuales clave (guardar en `.playwright-cli/`).
6. Cerrar sesiones al final (`playwright-cli -s=calypso close`).

Datos de prueba: si la BD de desarrollo no tiene contenido suficiente, sembrarlo con el script de seed del proyecto (si existe) antes de probar, nunca a mano en mitad de la prueba.

### Checklist por fase (acumulativo)

| Fase | Comprobaciones frontend |
|------|-------------------------|
| 1–2 | `/admin` carga, login funciona, aparecen todas las colecciones y el global `SiteConfig`. |
| 3 | Header sticky (sigue visible tras `mousewheel 0 2000`) con logo `/assets/logo.jpg`, "Calypso Noir", enlaces Home/Catálogo/Sobre mí/Contacto y badge de carrito. En móvil: hamburguesa abre/cierra el drawer y sus enlaces navegan. Footer: "Enviamos a todo el Perú", email y redes desde `SiteConfig`, botón "¿Deseas un diseño personalizado?" con `href` a `wa.me` y mensaje predeterminado. Fondo `#FEFFEE` (`eval "getComputedStyle(document.body).backgroundColor"`). |
| 4 | Carrusel muestra ≤3 slides, avanza, y "Ver colección" lleva a `/colecciones/<slug>`. Feed: colecciones de más reciente a más antigua, 4 productos cada una, paginación a la página 2 funciona. `/catalogo` y `/colecciones/[slug]` cargan. |
| 5 | `/productos/[slug]`: galería navega, título/descripción/precio "S/." y stock visibles. Selector de cantidad no supera el stock ni baja de 1; producto sin stock muestra "Agotado" y botón deshabilitado. Meta `og:title`, `og:image` presentes. Slug inexistente → 404 **con código HTTP 404 real** (`curl -o /dev/null -w '%{http_code}'`): un `loading.tsx` activa streaming y lo convierte en 200. |
| 6 | Agregar al carrito actualiza el badge; el carrito lateral muestra ítems, subtotal y total correctos; cambiar cantidad/eliminar recalcula; recargar conserva el carrito (`localstorage-list`). "Completar compra por WhatsApp" hace `POST /api/orders` (verificar en `requests`), redirige a `wa.me` con el código, y vacía el carrito. Interceptar la navegación externa con `route "https://wa.me/**" --status=200` para no salir del sitio. Admin del pedido: botones Confirmar / Cancelar pedido / Anular confirmación abren modal y aplican el cambio; "Emitir boleta de compra" descarga un PDF (`/api/orders/:id/boleta`, 401 sin sesión, 409 si no está finalizado). Fechas del admin en `dd/MM/yyyy - hh:mm a`. |
| 7 | `/sobre-mi` y `/contacto` muestran el contenido del CMS. `not-found` personalizado (código 404 real en `/xyz`, `/productos/no-existe`, `/?page=99`). `/sitemap.xml` y `/robots.txt` responden. Un cambio guardado en el admin (REST de Payload) se ve en la siguiente visita. Navegación por teclado (Tab) alcanza menú, carrito y botones con foco visible. |
| 8 | Mejoras (ver Fase 8 del plan). **8.1** — `/colecciones/[slug]` (página 1 y 2) no muestra ningún texto "N pieza(s)" (`snapshot` + `eval "document.body.innerText.match(/\d+ piezas?\b/)"` → `null`); la grilla de productos y la paginación siguen funcionando. **8.2** — Con un usuario QA (Local API), abrir un documento de cada colección y `globals/site-config`: `.doc-tabs__tabs li` = 0 (escritorio y móvil); `/admin/collections/products/<id>/api` muestra "No encontrado"; el pedido conserva sus botones y `fetch("/api/orders/<id>/boleta")` desde el admin → 200 PDF. **Botón "Cancelar" al crear:** en cada colección, lista → Crear → Cancelar vuelve a la lista; Panel → Productos → Crear → Cancelar → lista y "atrás" → Panel (historial secuencial); con datos escritos no guarda nada ni deja el aviso `beforeunload`; entrar directo por URL (pestaña nueva o desde la tienda) → Cancelar lleva al listado; no aparece al editar un registro existente, en `SiteConfig` ni dentro de un drawer. Borrar el usuario QA al final. **8.3** — Guardar una URL de Pinterest desde el admin (Configuración → Redes sociales) y verla en el footer (ícono con `aria-label="Pinterest"`, `target=_blank`, `rel=noopener noreferrer`, 44 px, foco visible) y en `/contacto` ("Pinterest @usuario"), en escritorio y móvil sin scroll horizontal; al vaciar el campo desaparece. Restaurar el valor original al final. **8.4** — Admin → Configuración → "Barra de anuncio": activar sin texto muestra "Escribe el texto o desactiva la barra."; enlace sin "/" y texto de 101 caracteres se rechazan. Con texto y enlace guardados: franja negra (`data-testid="announcement-bar"`) entre el header y el carrusel en `/` y `/?page=2`, no en otras páginas; ~35 px en escritorio, ≤2 líneas en iPhone 15 con 100 caracteres, sin scroll horizontal; enlace interno navega, externo abre en pestaña nueva con `noopener`; foco visible. Desactivada → no aparece. Restaurar el estado original al final. **Corrección header** — En `/` con scroll, clic en logo, nombre o "Home" (escritorio y menú móvil) sube a `scrollY=0` sin peticiones; "Catálogo" estando en `/catalogo` igual; desde `/?page=2`, otra página o con Ctrl+clic se comporta como antes. **8.5** — Diálogo de búsqueda: Enter vacío o con espacios muestra `data-testid="search-prompt"` ("Escribe algo para empezar a buscar o revisa nuestro catálogo.") sin navegar y con foco en el campo; con 1 letra, "Escribe al menos 2 letras…"; al escribir vuelve la ayuda corta; "Ver catálogo" (≥44 px de alto) cierra el diálogo y va a `/catalogo`; al reabrir no queda el aviso. `/buscar`, `/buscar?q=` y Enter vacío en esa página muestran el aviso; `?q=a` el de 2 letras; con resultados o sin coincidencias no aparece. **8.6** — Con snapshot previo de los productos: en el admin, "Precio de oferta" aparece solo con "En oferta" marcado; vacío o ≥ precio muestra error; guardar 29.90. En la tienda (escritorio y móvil): tarjeta con `badge-sale` "En oferta", `<s>` precio anterior y precio de oferta en `--sale` (#a8321e); agotado + oferta muestra solo "Agotado"; detalle con etiqueta en la galería, precio tachado + oferta y `og:title` con el precio de oferta; relacionados, `/buscar` y diálogo muestran la oferta; carrito con precio tachado y total con oferta; `POST /api/orders` guarda `unitPrice` de oferta y WhatsApp lleva ese total. Borrar el pedido QA y restaurar los productos. **8.7** — Snapshot de productos y tipos. Sin tipos, "Accesorios" no aparece. Admin: crear 2 tipos; crear producto sin tipo muestra "Elige el tipo de accesorio."; asignar tipos a productos de muestra; lista con columna "Tipo de accesorio". Escritorio: "ACCESORIOS" entre Catálogo y Sobre mí; hover abre el panel (sigue abierto al cruzar al panel, se cierra al salir); clic con mouse no lo cierra; Tab+Enter abre, ↓/↑ recorren, Esc cierra y devuelve el foco; clic fuera cierra; elegir un tipo lleva a `/accesorios/<slug>` con sus productos y el menú queda activo. Móvil: en el menú hamburguesa se expande, opciones ≥44 px, navega y cierra el menú. Desactivar un tipo lo quita del menú y su página da 404; `/accesorios/no-existe` y `?page=2` sin productos dan 404. Borrar los tipos de prueba y restaurar `updated_at`. **8.8** — Con snapshot previo (respetar los tipos y productos del usuario): poner 2 productos en oferta y asignar un tipo. En `/colecciones/<slug>`, `/accesorios/<slug>` y la sección Productos de `/buscar`: `data-testid="product-filters"` con check "Oferta" y select "Ordenar por" (Más recientes, Precio: Mayor a menor, Precio: Menor a mayor, Nombre: A - Z, Nombre: Z - A); cada opción reordena (precio con el de oferta), cambia la URL (`?oferta=1 |orden=…`) sin mover el scroll y conserva `q`; valores inválidos en la URL → por defecto; "Oferta" sin resultados muestra "No hay piezas en oferta por ahora." con "Ver todas las piezas"; sin productos no se muestran filtros. Móvil: una fila, controles de 44 px. Restaurar el snapshot. |
| 9 | Repetir el checklist 3–8 contra el despliegue (URL de producción o `docker compose up` local). |

## Paso 4 — Reporte

Terminar con un reporte breve en español:

```
## Fase N — <APROBADA | FALLIDA>
- Estáticos: tsc ✔ | lint ✔ (2 warnings) | build ✔
- Vitest: 24/24 ✔
- Frontend (escritorio / móvil): 11/11 ✔ | 10/11 ✘
Fallos:
- <qué falló, evidencia (archivo:línea, captura), causa, estado: corregido / pendiente>
```

No declarar la fase aprobada si algún paso no se ejecutó; indicar explícitamente qué se omitió y por qué.
