# <img src="./public/img/favicon.png" width="45" height="45" align="center"> Micro Polirritmian

**Micro Polirritmian** El proyecto "micro-polirritmian" se fundamenta en la creación de una herramienta de software que resuelva problemas de cálculo rítmico complejo mediante algoritmos euclidianos. Se priorizará el uso de Software Libre y entornos de desarrollo austeros para garantizar la sostenibilidad y eficiencia en el consumo de recursos de hardware. Esta práctica introduce al estudiante en la arquitectura cliente-servidor, el uso de APIs y la manipulación de audio digital mediante estándares web.

---

## Características Principales
Aplicación web para la generación y visualización de polirritmias musicales complejas. El sistema utiliza un motor de cálculo de alto rendimiento en C++ para procesar algoritmos de distribución de pulsos (Algoritmo de Bjorklund) y una interfaz interactiva en HTML, CSS y JavaScript Vanilla. La comunicación se realiza mediante una muy simplificada API REST, garantizando una separación estricta entre la lógica de negocio y la interfaz de usuario.

## Instrucciones de compilación:
1. Ejecutar el script build.sh o la línea de compilación directamente:
```bash
g++ main.cpp -o ../server.bin -lpthread
```

2. Luego ejecutar en una terminal el binario generado:
```bash
./server.bin
```

3. Abrir en un navegador web la url:
```text
http://localhost:8080/
```

## Tecnologías Utilizadas

### Backend
* **Httplib:** Servidor robusto y escalable.
* **Json for C++:** Gestión eficiente de subida de archivos binarios.

### Frontend
* **Vanilla JavaScript:** Lógica pura sin dependencias de frameworks pesados.
* **Vanilla CSS:** Diseño con puro CSS sin frameworks.

## Estructura del Proyecto

```text
├── public/
│   ├── css/             # Estilos personalizados (style.css).
│   ├── img/             # Activos visuales (favicon.png).
│   └── js/
│       ├── app.js       # gestión de aplicaicón.
│       ├── audio.js     # motor de audio.
│       ├── visual.js    # lógica de visualización.
├── server/
│   ├── include/         # httplib.h y json.hpp, bibliotecas necesarias.
│   ├── build.sh         # Script de compilación.
│   ├── main.cpp         # lógica y cáclculo de servidor.
│   ├── uploads/         # Almacenamiento físico de sonidos. (en construcción)
│   └── utils/           # Helpers de sistema de archivos (fileHelper) (en construcción)