# BiblioTech frontend (React 18 + TS + Vite)

Cliente REST delgado de `api/openapi.yaml`. Toda la lógica vive en el backend;
acá solo hay vistas por UC: login/registro (UC-001), catálogo + búsqueda (UC-003/005),
detalle + descarga con JWT (UC-006), subida Professor/Admin (UC-002) y admin (UC-004).

```bash
npm install
npm test        # Vitest
npm run build   # tsc + vite -> dist/
npm run dev     # :5173 (proxy /api -> :3000 en dev)
```

`VITE_API_URL` (default `''`): base del API en producción.
