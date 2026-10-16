# BiblioTech — guía de uso por rol (UI)

> Guía cliente: qué ve y qué puede hacer cada rol en la web (`:5173`).
> Fuente técnica: [`api/openapi.yaml`](../api/openapi.yaml), [`frontend/src/App.tsx`](../frontend/src/App.tsx) (rutas y guards),
> [`docs/02-requirements/use-cases/UC-001..UC-006`](02-requirements/use-cases/). Sin acceso anónimo: toda
> pantalla salvo `/login` y `/register` exige sesión; sin token la app redirige
> a `/login` (BR-002).

## Reglas comunes

- Sesión JWT (expira ≤ 24h). El rol viaja en el token: tras un cambio de rol
  hay que **volver a hacer login** para que la UI y el backend vean el rol nuevo
  (UC-004). Además, el cambio de rol **revoca los tokens vigentes** (sube
  `token_version`): el token viejo deja de ser válido y el backend responde `401`,
  por lo que el re-login es obligatorio, no solo una comodidad de UI (NFR-006/ADR-0004).
- Registro público = siempre **Student**, aunque se intente pedir otro rol
  (decisión OQ-01, FR-001/UC-001).
- Password ≥ 8 caracteres; email con formato válido (BR-003). Email duplicado
  → error 409.
- La barra muestra el rol actual y el botón Salir. Sin permiso para una ruta se
  ve `403: rol insuficiente`.

## Student — lector

1. Abrir `/register`, cargar email + password y pulsar **Registrarme**.
   Queda logueado como Student.
2. En `/login` entrar con email + password en visitas siguientes.
3. En `/` (Catálogo) ver el material, filtrar (texto q, autor, subject, año,
   edición, tag) y paginar (defaults 1/10, máx 50).
4. Abrir un ítem en `/material/:id` para ver metadatos y descargar el archivo
   original (UC-006).
5. Rutas `/upload` y `/admin` → `403: rol insuficiente`.

## Professor — publica y gestiona lo propio

1. **Obtener el rol:** no hay auto-registro de Professor. La persona se registra
   como Student y un Admin la promueve en `/admin` (desplegable de rol), o el
   Admin crea la cuenta directo vía `POST /users` (solo API).
2. **Volver a hacer login** para que el token traiga `role: Professor`.
3. En `/upload` (visible solo para Professor/Admin) completar: archivo
   PDF/EPUB ≤ 50MB, título y autor obligatorios; subject/año/edición/tags
   opcionales. Subida válida → `201` con id (UC-002).
4. Puede editar/borrar **solo su material**; material ajeno → `403`. Borrar un
   material borra también su archivo (cascada C-1).
5. Archivos con tipo o tamaño inválido → `413/415`; metadatos inválidos → `400`.

## Admin — control total

1. **Primer Admin:** no se crea desde la UI (sería huevo-gallina: gestionar
   usuarios exige JWT Admin). Se siembra por SQL según [`backend/README.md`](../backend/README.md) y
   luego entra por `/login`.
2. En `/admin` ve la lista de usuarios (`GET /users`), cambia el rol con el
   desplegable (`PATCH /users/:id` → 200) y borra cuentas con confirmación
   (`DELETE /users/:id` → 204, cascada C-2: cuenta + sus materiales + archivos).
3. Puede editar/borrar **cualquier** material, incluido el de otros (C-3).
4. Los siguientes Admins los promueve un Admin existente desde `/admin`, o los
   crea vía `POST /users` (solo API, `requestedRole` requerido).
5. Tras promover a alguien, avisarle que **re-haga login** para activar el rol.

## Errores que puede ver cada rol

| Situación | Resultado |
|---|---|
| Sin sesión en cualquier pantalla protegida | Redirección a `/login` (401) |
| Student en `/upload` o `/admin` | `403: rol insuficiente` |
| Professor en material ajeno (editar/borrar) o en `/admin` | `403`, nada cambia |
| Email ya registrado | `409` |
| Recurso inexistente | `404` |
| Archivo > 50MB / MIME no permitido | `413` / `415` |
