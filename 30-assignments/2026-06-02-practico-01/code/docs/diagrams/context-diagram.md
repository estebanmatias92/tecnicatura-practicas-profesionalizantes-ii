# Diagrama de Contexto — Sample Vault

> System Boundary usando notación C4. Muestra los actores, el sistema y los sistemas externos.

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

LAYOUT_WITH_LEGEND()

title System Context — Sample Vault

Person(guest, "Guest", "Visitante sin cuenta")
Person(producer, "Producer", "Músico o productor que gestiona sus samples")
Person(admin, "Admin", "Administrador de la plataforma")

System_Boundary(sv, "Sample Vault") {
    System(webapp, "Web Application", "SPA vanilla JS + W3.CSS\nFrontend que consume la API")
    System(api, "REST API", "Express 5\nBackend con autenticación JWT y subida de archivos")
}

System_Ext(db, "MySQL Database", "Almacena usuarios, roles y metadatos de samples")
System_Ext(fs, "File System", "Almacena archivos de audio en uploads/")

Rel(guest, webapp, "Accede a login/register", "HTTPS")
Rel(producer, webapp, "Gestiona sus samples (subir/listar/borrar)", "HTTPS")
Rel(admin, webapp, "Administra usuarios", "HTTPS")

Rel(webapp, api, "Consume endpoints REST", "JSON + Bearer JWT")
Rel(api, db, "Opera mediante stored procedures", "mysql2")
Rel(api, fs, "Lee/escribe archivos de audio", "disk I/O")
@enduml
```

<details>
<summary>Código PlantUML</summary
</details>

## Actores

| Actor | Descripción |
| ------- | ------------- |
| **Guest** | Visitante sin cuenta. Solo accede a login/register. |
| **Producer** | Usuario registrado con rol `producer`. Gestiona samples (subir, listar, borrar). |
| **Admin** | Usuario registrado con rol `admin`. Administra usuarios (listar, eliminar). |

## Sistemas externos

| Sistema | Rol |
| --------- | --- |
| **MySQL Database** | Persistencia de usuarios, roles, metadatos de samples. Acceso exclusivamente mediante stored procedures. |
| **File System** | Almacenamiento de archivos de audio en `uploads/`. |

## Límite del sistema

Queda fuera del sistema Sample Vault:
- Autenticación OAuth / SSO
- CDN para distribución de audio
- Replicación de la base de datos
- Backup automatizado
