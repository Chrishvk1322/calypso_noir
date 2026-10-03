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
| 6 | `POST /api/orders`: body inválido → 400; cantidad > stock → 409; precios tomados de BD (ignora precio enviado); `orderCode` con formato `#PED-\d{4}` y único; total correcto; plantilla con `{orderCode}`/`{totalAmount}` reemplazados. Hook de stock: `pending→confirmed` descuenta, `confirmed→cancelled` repone, re-guardar un confirmado no descuenta dos veces. |
| 7 | Hooks de revalidación no rompen la escritura; `sitemap` lista productos/colecciones activos. |
| 8 | Igual que 1–7 contra el build de producción / contenedor. |

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
| 6 | Agregar al carrito actualiza el badge; el carrito lateral muestra ítems, subtotal y total correctos; cambiar cantidad/eliminar recalcula; recargar conserva el carrito (`localstorage-list`). "Completar compra por WhatsApp" hace `POST /api/orders` (verificar en `requests`), redirige a `wa.me` con el código, y vacía el carrito. Interceptar la navegación externa con `route "https://wa.me/**" --status=200` para no salir del sitio. |
| 7 | `/sobre-mi` y `/contacto` muestran el contenido del CMS. `not-found` personalizado (código 404 real en `/xyz`, `/productos/no-existe`, `/?page=99`). `/sitemap.xml` y `/robots.txt` responden. Un cambio guardado en el admin (REST de Payload) se ve en la siguiente visita. Navegación por teclado (Tab) alcanza menú, carrito y botones con foco visible. |
| 8 | Repetir el checklist 3–7 contra el despliegue (URL de producción o `docker compose up` local). |

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
