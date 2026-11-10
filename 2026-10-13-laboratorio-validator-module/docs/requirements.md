# BiblioTech — Requerimientos (Agile-lite)

## Visión

BiblioTech es una biblioteca digital donde profesores publican material bibliográfico
(PDF/EPUB) y estudiantes autenticados lo consultan. Admin controla usuarios y material.
El sistema se entrega como una aplicación web con backend y frontend separados, y se
opera en contenedores con perfiles dev y prod.

Alcance v1: autenticación por roles, publicación y consulta de material, borradores,
visibilidad, visor embebido, descarga, eliminación lógica y papelera de Admin.
Fuera de alcance: préstamos físicos, reservas, multas, notificaciones, versionado,
deduplicación, transferencia de propiedad y refresh tokens.

## Roles

| Rol | Puede |
| --- | --- |
| Student | Registrarse, iniciar sesión, ver catálogo público, leer y descargar material público. |
| Professor | Todo lo de Student + crear borradores, adjuntar archivo, publicar/ocultar, editar y eliminar su propio material, ver sus ocultos. |
| Admin | Todo + gestionar usuarios y roles, ver material oculto, eliminar/restaurar cualquier material y usar la papelera. |

Todo acceso a material exige autenticación.

## Requerimientos funcionales

| ID | Requerimiento |
| --- | --- |
| FR-001 | Registro público de Student con email único y contraseña. |
| FR-002 | Login con email/contraseña que devuelve una sesión JWT. |
| FR-003 | Consulta del usuario autenticado actual. |
| FR-004 | Admin lista usuarios, crea usuarios con rol y cambia roles. |
| FR-005 | Professor/Admin crea un borrador automáticamente al ingresar el primer campo no vacío. |
| FR-006 | Professor/Admin edita los metadatos de un material propio; Admin puede editar cualquiera. |
| FR-007 | Professor/Admin adjunta o reemplaza el archivo de un material propio. |
| FR-008 | Professor/Admin publica un material propio; Admin puede publicar cualquiera. |
| FR-009 | Professor/Admin oculta un material propio; Admin puede ocultar cualquiera. |
| FR-010 | Catálogo paginado de materiales públicos con búsqueda por texto y filtros por materia y año. |
| FR-011 | Professor/Admin lista sus materiales, incluyendo borradores y ocultos. |
| FR-012 | Admin lista todos los materiales, incluyendo ocultos y eliminados. |
| FR-013 | Cualquier usuario autenticado lee un material visible en un visor embebido. |
| FR-014 | Cualquier usuario autenticado descarga el archivo de un material visible. |
| FR-015 | Professor/Admin elimina lógicamente un material; Admin lo restaura desde la papelera. |
| FR-016 | Logout del cliente que descarta la sesión local. |

## Requerimientos no funcionales

| ID | Requerimiento |
| --- | --- |
| NFR-001 | Contraseñas con BCrypt (coste ≥ 10) y sesiones JWT firmadas; ningún endpoint de material es anónimo. |
| NFR-002 | Validación de archivos por MIME, extensión, magic bytes y tamaño máximo (50 MB por defecto). |
| NFR-003 | Separación MVC distribuido: Model sin React/Nest, Controller sin reglas de negocio, View sin SQL. |
| NFR-004 | Persistencia exclusivamente a través de repositorios; sin SQL en controllers. |
| NFR-005 | Validación de reglas de negocio en un módulo Validator del Model, además de los DTOs. |
| NFR-006 | Entornos dev/prod autocontenidos y reproducibles con Docker Compose; secretos fuera de las imágenes. |
| NFR-007 | La imagen de producción no incluye tests, mocks ni devDependencies. |
| NFR-008 | Migraciones versionadas y seed idempotente; `synchronize` deshabilitado. |
| NFR-009 | Cobertura de líneas ≥ 80% en backend (dominio/seguridad) y ≥ 70% en frontend (módulos críticos). |
| NFR-010 | Endpoint de salud con verificación de base de datos. |
| NFR-011 | Nombres de archivo saneados; nunca se usa el nombre original como ruta de almacenamiento. |
| NFR-012 | Cambiar el rol de un usuario invalida sus sesiones JWT vigentes. |

## Reglas de negocio

| ID | Regla |
| --- | --- |
| BR-001 | Un usuario tiene exactamente un rol: Admin, Professor o Student. |
| BR-002 | El registro público crea siempre Student; cualquier rol solicitado por el cliente se ignora. |
| BR-003 | El email es único (case-insensitive) y la contraseña tiene al menos 8 caracteres. |
| BR-004 | Un material tiene como máximo un archivo (1:1) y un propietario. |
| BR-005 | `autor` (obra) y `propietario` (usuario) son conceptos distintos. |
| BR-006 | Un material nuevo nace oculto y sin fecha de publicación. |
| BR-007 | Un borrador (nunca publicado) es siempre oculto. |
| BR-008 | Publicar exige título, autor y archivo, y setea la fecha de primera publicación solo la primera vez. |
| BR-009 | Ocultar no elimina la condición de publicación ni borra el archivo. |
| BR-010 | El catálogo y la búsqueda solo incluyen materiales públicos y no eliminados. |
| BR-011 | Un material oculto solo es visible para su propietario y Admin; para el resto responde 404. |
| BR-012 | Eliminar es lógico: el material deja de ser visible para todos salvo Admin, y el archivo se conserva. |
| BR-013 | Restaurar conserva la visibilidad previa y es exclusivo de Admin. |
| BR-014 | Solo el propietario o Admin pueden editar, publicar, ocultar, adjuntar archivo o eliminar un material. |
| BR-015 | No hay versionado, deduplicación ni transferencia de propiedad en v1. |

## Historias de usuario

### US-001 — Registro e inicio de sesión

Como visitante quiero registrarme como Student e iniciar sesión para consultar el catálogo.

```gherkin
Escenario: registro exitoso
  Dado un email no registrado y una contraseña de al menos 8 caracteres
  Cuando me registro
  Entonces mi cuenta tiene rol Student
  Y recibo una sesión JWT

Escenario: intento de escalada de rol
  Dado un registro con "role": "Admin" en el cuerpo
  Cuando me registro
  Entonces mi cuenta sigue siendo Student

Escenario: email duplicado
  Dado un email ya registrado
  Cuando intento registrarme
  Entonces recibo 409
```

### US-002 — Crear borrador y publicar

Como Professor quiero crear un material, adjuntar un archivo y publicarlo.

```gherkin
Escenario: borrador automático
  Dado el formulario de material vacío
  Cuando ingreso el primer campo no vacío
  Entonces se crea un borrador oculto
  Y el catálogo no lo muestra

Escenario: publicación incompleta
  Dado un borrador sin archivo
  Cuando intento publicarlo
  Entonces recibo 400

Escenario: publicación exitosa
  Dado un borrador con título, autor y archivo PDF o EPUB válido
  Cuando lo publico
  Entonces se vuelve público
  Y aparece en el catálogo
```

### US-003 — Consultar catálogo

Como Student quiero buscar y filtrar material público.

```gherkin
Escenario: búsqueda por texto
  Dado material público con títulos y autores distintos
  Cuando busco por un término
  Entonces veo solo coincidencias públicas

Escenario: material oculto
  Dado un material oculto de otro usuario
  Cuando accedo por ID
  Entonces recibo 404
```

### US-004 — Leer y descargar

Como usuario autenticado quiero leer el material en un visor y descargarlo.

```gherkin
Escenario: visor PDF
  Dado un material público con archivo PDF
  Cuando abro "Leer material"
  Entonces veo el PDF en el modal

Escenario: visor EPUB
  Dado un material público con archivo EPUB
  Cuando abro "Leer material"
  Entonces veo el contenido renderizado por epub.js

Escenario: descarga
  Cuando presiono "Descargar"
  Entonces recibo el archivo original con su nombre saneado
```

### US-005 — Gestionar visibilidad

Como Professor quiero ocultar y volver a publicar mi material.

```gherkin
Escenario: ocultar
  Dado un material público propio
  Cuando lo oculto
  Entonces deja de aparecer en el catálogo
  Y sigue siendo visible para mí y para Admin

Escenario: volver a publicar
  Dado un material oculto ya publicado
  Cuando lo publico
  Entonces vuelve al catálogo sin pedir archivo de nuevo
```

### US-006 — Administrar usuarios

Como Admin quiero crear usuarios y cambiar roles.

```gherkin
Escenario: promover a Professor
  Dado un Student existente
  Cuando cambio su rol a Professor
  Entonces puede subir material
  Y sus sesiones JWT anteriores dejan de ser válidas
```

### US-007 — Eliminar y restaurar

Como Professor quiero eliminar mi material y como Admin quiero restaurarlo.

```gherkin
Escenario: eliminación lógica
  Dado un material propio
  Cuando lo elimino
  Entonces recibo 204
  Y nadie más lo ve, incluido yo

Escenario: papelera
  Dado un material eliminado
  Cuando Admin abre la papelera
  Entonces lo ve listado
  Y puede restaurarlo conservando su visibilidad previa
```

### US-008 — Operar en dev y prod

Como equipo queremos levantar el sistema de forma reproducible en dos perfiles.

```gherkin
Escenario: desarrollo
  Cuando ejecuto "make dev"
  Entonces tengo db, api con hot reload, web con Vite y Adminer
  Y se aplican migraciones y seed demo

Escenario: producción
  Cuando ejecuto "make prod"
  Entonces tengo db, api y web con imágenes multi-stage
  Y no hay tests, mocks ni Adminer
  Y solo se expone el puerto 8080
```
