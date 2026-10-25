# BiblioTech

Biblioteca digital donde profesores publican material bibliográfico y estudiantes autenticados lo consultan. Este glosario fija el vocabulario del dominio; no describe implementación.

## Roles

**Admin**:
Rol con control total sobre usuarios y material, incluidos los ocultos y los eliminados.
_Avoid_: Administrador genérico, superusuario

**Professor**:
Rol que crea, publica, oculta, edita y elimina el material del que es propietario.
_Avoid_: Docente, maestro

**Student**:
Rol de lectura: consulta y descarga material público.
_Avoid_: Alumno, cliente

**Usuario**:
Cuenta autenticable con email único, contraseña y un único rol.
_Avoid_: Cuenta, login

## Material

**Material**:
Ítem bibliográfico digital con metadatos, un propietario y, como máximo, un archivo adjunto.
_Avoid_: Libro, recurso, publicación (como entidad)

**Borrador**:
Material que nunca fue publicado; por definición es oculto.
_Avoid_: Estado borrador, material preliminar

**Publicación**:
Material que fue publicado al menos una vez; puede estar público u oculto.
_Avoid_: Material publicado (como entidad distinta), post

**Visibilidad**:
Condición que determina quién puede ver un material: oculto o público.
_Avoid_: Estado, privacidad

**Oculto**:
Visibilidad que restringe el material a su propietario y a Admin.
_Avoid_: Privado, despublicado, inactivo

**Público**:
Visibilidad que expone el material a todos los roles autenticados.
_Avoid_: Visible, activo

**Publicar**:
Acción explícita que vuelve público un material; exige título, autor y archivo.
_Avoid_: Desocultar, activar, subir

**Ocultar**:
Acción explícita que vuelve oculto un material sin eliminarlo.
_Avoid_: Despublicar, archivar, retirar

**Eliminar**:
Acción que marca un material como eliminado sin destruirlo; deja de ser visible para todos salvo Admin.
_Avoid_: Borrar, destruir, hard delete

**Papelera**:
Vista de Admin con los materiales eliminados, desde donde puede restaurarlos.
_Avoid_: Trash, reciclaje

**Restaurar**:
Acción de Admin que revierte la eliminación de un material, conservando su visibilidad previa.
_Avoid_: Recuperar, deseliminar

**Autor**:
Persona que escribió la obra; es un dato del material y no necesariamente su propietario.
_Avoid_: Profesor (como sinónimo), creador

**Propietario**:
Usuario que creó y gestiona el material.
_Avoid_: Dueño, autor

**FileBlob**:
Archivo binario asociado uno a uno con un material; no tiene vida propia fuera de él.
_Avoid_: Archivo suelto, adjunto compartido

**Catálogo**:
Vista consultable de los materiales públicos.
_Avoid_: Listado, inventario

**Leer**:
Abrir el material en el visor embebido.
_Avoid_: Ver, previsualizar

**Descargar**:
Obtener una copia del archivo del material.
_Avoid_: Bajar, exportar

## Términos descartados

| Término evitado | Usar en su lugar | Motivo |
| --- | --- | --- |
| Libro | Material | El material puede ser PDF o EPUB |
| Alumno | Student | Roles canónicos en inglés |
| Docente / Maestro | Professor | Roles canónicos en inglés |
| Despublicar | Ocultar | Ocultar no borra la condición de publicación |
| Hard delete | Eliminar | La eliminación es lógica y restaurable |
| Transferencia | — | Fuera de alcance en v1 |
| Deduplicación | — | Cada material tiene su propio archivo |
| Versión | — | Sin versionado en v1 |
