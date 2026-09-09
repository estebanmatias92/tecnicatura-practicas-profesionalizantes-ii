# Laboratorio: Patrón Observer (GoF)

> Práctica de estudio del patrón de diseño **Observer** (o *Publisher/Subscriber*)
> en su versión original del libro *Design Patterns — Elements of Reusable
> Object-Oriented Software* (Gamma, Helm, Johnson, Vlissides).

## ¿Qué es el patrón Observer?

Define una dependencia **uno-a-muchos** entre objetos: cuando el objeto
**Sujeto** (*Subject*) cambia de estado, **notifica** automáticamente a todos sus
**Observadores** (*Observers*) dependientes.

- **Sujeto (Subject):** mantiene el estado y la lista de observadores. Expone
  `Attach`, `Detach` y `Notify`.
- **Observador (Observer):** interfaz con el método `Update`, que el sujeto
  invoca cuando algo cambia.
- **Concretos (ClockTimer, DigitalClock, AnalogClock):** implementaciones que
  participan del patrón.

Beneficios principales:
- **Bajo acoplamiento:** el sujeto solo conoce la interfaz `Observer`, no las
  clases concretas.
- **Open/Closed:** se agregan observadores sin tocar el sujeto.
- **Consistencia:** los observadores se mantienen sincronizados con el sujeto.

## Implementaciones incluidas

El ejemplo del reloj (un `ClockTimer` que notifica a `DigitalClock` y
`AnalogClock`) se presenta en **cinco variantes**, cada una con un enfoque de
composición distinto:

| Archivo | Composición del Sujeto | Firma de `Update` | Observación |
|---|---|---|---|
| `main.cpp` | `Subject` hereda de `Observer` (GoF canónico) | `Update(Subject*)` | Versión original del libro (con `push`) |
| `main_test_comp.cpp` | `ClockTimer` **compone** un `Subject*` | `Update()` | Sujeto separado del dominio |
| `main_test_comp_easy_read.cpp` | `ClockTimer` compone un `Subject*` (inline) | `Update()` | Mismo diseño, más legible |
| `observer_comp_easy_read.cpp` | ídem comp. (`Subject` inline) | `Update()` | Variante legible de composición |
| `observer_agreg_easy_read.cpp` | **Agregación** vía interfaz `ISubject` | `Update()` | Desacopla aún más con abstracción |

> **Diferencia clave:** en `main.cpp` el `Update` recibe el sujeto (*push*, el
> observador compara `theChangedSubject == _subject`). En el resto, el
> observador ya guarda el puntero al `ClockTimer` y usa `Update()` sin
> argumentos (*pull*/sin dato adicional).

## Diagramas

- [Diagrama de clases (GoF)](01-plain-gof/docs/class-diagram-gof.png)
- [Diagrama de clases (PNG)](01-plain-gof/docs/class-diagram.png)
- [Diagrama de secuencia](01-plain-gof/docs/sequence-diagram.gif)
- Fuente editable en [Dia](01-plain-gof/docs/class-diagram.dia)

## Compilar y ejecutar

Prerrequisitos: compilador `g++` con soporte C++11.

### Linux / macOS

```bash
cd 01-plain-gof
chmod +x build.sh
./build.sh          # compila a ./bin/main.bin
./bin/main.bin      # ejecuta la demo
```

### Windows (cmd)

```bat
cd 01-plain-gof
build.bat
bin\main.exe
```

La salida muestra los ticks del `ClockTimer` dibujados por ambos relojes:

```
I am Analog: 00:00:01
I am Digital: 00:00:01
I am Analog: 00:00:02
I am Digital: 00:00:02
...
```

## Estructura del repo

```
2026-09-09-laboratorio-observer-pattern/
├── 01-plain-gof/                 # variantes del patrón (GoF)
│   ├── main.cpp                  # versión canónica (push)
│   ├── main_test_comp.cpp
│   ├── main_test_comp_easy_read.cpp
│   ├── observer_comp_easy_read.cpp
│   ├── observer_agreg_easy_read.cpp
│   ├── build.sh                  # compilación Linux/macOS
│   ├── build.bat                 # compilación Windows
│   └── docs/
│       ├── class-diagram-gof.png
│       ├── class-diagram.png
│       ├── class-diagram.dia
│       └── sequence-diagram.gif
└── README.md
```

## Autoría

- **Patrón de diseño:** Erich Gamma, Richard Helm, Ralph Johnson y John
  Vlissides — *Design Patterns* (GoF), 1994.
- **Implementador:** Gabriel Nicolás González Ferreira.
