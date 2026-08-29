# <img src="frontend/img/favicon-gold.png" width="45" height="45" align="center"> SampleVault

**SampleVault** es una aplicación web diseñada para la gestión profesional de librerías de sonido. Permite a los productores musicales subir, categorizar, escuchar y organizar sus muestras de audio (samples) de forma privada y segura, todo bajo una arquitectura modular y eficiente.

---

## 🚀 Características Principales

* **Gestión de Samples:** Sube archivos de audio (MP3, WAV, OGG, FLAC) con metadatos personalizados (BPM, categoría).
* **Reproductor Integrado:** Escucha tus sonidos directamente desde la biblioteca mediante una interfaz minimalista.
* **Arquitectura Limpia:** Separación total de responsabilidades entre controladores, servicios y utilidades.
* **Frontend "Zero innerHTML":** Manipulación del DOM 100% nativa para máxima seguridad y rendimiento.
* **Sostenibilidad de Software:** Código optimizado siguiendo principios de eficiencia en el consumo de recursos (inspirado en el modelo **GREENSOFT**).

## 🛠️ Tecnologías Utilizadas

### Backend
* **Node.js & Express:** Servidor robusto y escalable.
* **Multer:** Gestión eficiente de subida de archivos binarios.
* **MySQL/MariaDB:** Persistencia de metadatos de forma relacional.

### Frontend
* **Vanilla JavaScript:** Lógica pura sin dependencias de frameworks pesados.
* **W3.CSS:** Framework CSS ligero para una interfaz moderna y responsiva.
* **Web Components (Custom):** Manejo dinámico de la UI mediante inyección de nodos nativos.

---

### Inicialización del Backend:
Entra en la carpeta del servidor e instala las dependencias necesarias:
```bash
cd backend
npm init -y  # Crea el archivo package.json por defecto
```
### Instalación de módulos:
Ejecuta este comando para instalar todas las bibliotecas que configuramos en los scripts:
```bash
npm install express mysql2 cors multer jsonwebtoken bcrypt dotenv
```
### Agregar archivo .env en el directorio backend/ con estas variables como ejemplo:
```text
PORT=3000
DB_HOST=localhost
DB_USER=samplevault
DB_PASS=samplevault
DB_NAME=samplevault
JWT_SECRET=tu_clave_secreta_super_segura
NODE_ENV=production
```
## 📂 Estructura del Proyecto

```text
├── backend/
│   ├── config/          # Configuración de Multer y DB.
│   ├── controllers/     # Lógica de negocio.
│   ├── middleware/      # Auth y autorización.
│   ├── repositories/    # Acceso a datos (SQL).
│   ├── routes/          # Rutas de acceso a módulos del backend.
│   ├── uploads/         # Almacenamiento físico de sonidos.
│   └── utils/           # Helpers transversales
│       ├── fileHelper.js
│       ├── language_manager/           # Singleton i18n usado por el Visitor
│       │   ├── language_manager.js
│       │   └── locales/                # Recursos es.json, en.json, etc.
│       └── validation_handler/         # Patrón Visitor para validaciones
│           ├── validation_handler.js   # Visitor concreto
│           └── validations/
│               ├── email.js            # Elemento concreto (implementado)
│               ├── cuit.js             # Elemento concreto (stub vacío)
│               └── password.js         # Elemento concreto (stub vacío)
├── frontend/
│   ├── css/             # Estilos personalizados.
│   ├── html/            # Archivos de maquetación estáticos.
│   ├── img/             # Activos visuales (favicon.png).
│   └── js/
│       ├── components/  # Manejadores de UI dinámicos (uiHandlers.js).
│       ├── frontControllers/  # Controladores de lógica frontend.
│       ├── services/    # Cliente API (apiService.js).
│       ├── utils/  # Lógica de sesión (authHelper.js).
│       └── tests/  # Scripts necesarios para crear el frontend de los tests.
├── test-samples/ #samples de prueba para subir.
```

---

## 🎨 Diagrama de Clases — Patrón Visitor (`backend/utils/validation_handler/`)

Implementación del patrón **Visitor** donde `ValidationHandler` actúa como **Visitante** y cada validación (`Email`, `Cuit`, `Password`) actúa como **Elemento** visitable. La inyección `validationObject.validationHandler = this` en `backend/utils/validation_handler/validation_handler.js:39` es el punto clave del double-dispatch.

```mermaid
classDiagram
    class ValidationHandler {
        -LanguageManager languageManager
        -Object _target
        +isValid(target, validationObject) bool
        +validateThis(target) ValidationHandler
        +with(validationObject) ValidationHandler
    }

    class Validation {
        <<interface>>
        +String _messageName
        +ValidationHandler validationHandler
        +evaluate(target) bool
        +validate(target) void
    }

    class Email {
        -String _messageName = "CT_INVALID_EMAIL"
        -ValidationHandler validationHandler
        +messageName String
        +evaluate(target) bool
        +validate(target) void
    }

    class Cuit {
        <<stub vacío>>
        +evaluate(target) bool
        +validate(target) void
    }

    class Password {
        <<stub vacío>>
        +evaluate(target) bool
        +validate(target) void
    }

    class LanguageManager {
        <<Singleton>>
        -String _language = "es"
        -Object _resources
        -String _localesPath
        -_loadLocales() void
        +language String
        +getThisMessage(messageName) String
    }

    Validation <|.. Email : implementa
    Validation <|.. Cuit : implementa
    Validation <|.. Password : implementa

    ValidationHandler --> Validation : "visita via isValid()<br/>backend/utils/validation_handler/validation_handler.js:17<br/>with() backend/utils/validation_handler/validation_handler.js:37"
    Email ..> LanguageManager : "usa via validationHandler.languageManager.getThisMessage()<br/>backend/utils/validation_handler/validations/email.js:25"
    Cuit ..> LanguageManager : previsto
    Password ..> LanguageManager : previsto
    ValidationHandler o--> LanguageManager : "compone<br/>backend/utils/validation_handler/validation_handler.js:7"
    ValidationHandler ..> Validation : "inyecta visitor<br/>validationObject.validationHandler = this<br/>backend/utils/validation_handler/validation_handler.js:39"
    Validation ..> ValidationHandler : "callback validate()<br/>backend/utils/validation_handler/validations/email.js:21"
```

### Roles GoF

| Rol GoF | Clase en el repo | Archivo | Descripción |
|---|---|---|---|
| **Visitor** | `ValidationHandler` | `backend/utils/validation_handler/validation_handler.js:3` | Define `isValid()` (visita stateless) y `validateThis().with()` (visita con estado + i18n). |
| **ConcreteVisitor** | `ValidationHandler` (mismo) | `backend/utils/validation_handler/validation_handler.js:37` | Inyecta `this` en el elemento y delega `validate()` — `backend/utils/validation_handler/validation_handler.js:39-40`. |
| **Element** (interfaz) | `Validation` (contrato implícito) | `backend/utils/validation_handler/validations/email.js:14,21` | Contrata `evaluate(target): bool` y `validate(target): void`. |
| **ConcreteElement** | `Email` | `backend/utils/validation_handler/validations/email.js:1` | Implementa validación por regex y lanza `Error` con mensaje i18n. `Cuit`/`Password` son stubs vacíos (`backend/utils/validation_handler/validations/cuit.js:0`, `backend/utils/validation_handler/validations/password.js:0`) que deberán seguir el mismo contrato. |
| **ObjectStructure / Client** | Código consumidor | — | `validator.validateThis("contacto@ejemplo.com").with(new Email())` — `backend/utils/validation_handler/validation_handler.js:28`. |

### Flujo `validateThis().with()` (double-dispatch)

1. `validateThis(target)` guarda `_target` y retorna `this` (fluent) — `backend/utils/validation_handler/validation_handler.js:30`.
2. `with(validationObject)` inyecta el visitor: `validationObject.validationHandler = this` — `backend/utils/validation_handler/validation_handler.js:39`.
3. Delega al elemento: `validationObject.validate(_target)` — `backend/utils/validation_handler/validation_handler.js:40`.
4. El elemento hace callback al visitor para i18n: `this.validationHandler.languageManager.getThisMessage(this._messageName)` — `backend/utils/validation_handler/validations/email.js:25` → `backend/utils/language_manager/language_manager.js:64`.

> **Nota:** `isValid(target, validationObject)` — `backend/utils/validation_handler/validation_handler.js:17` es la variante stateless/pura (`return validationObject.evaluate(target)`) sin efecto de excepción ni i18n; `with()` es la variante Visitor con efecto y mensaje localizado.
