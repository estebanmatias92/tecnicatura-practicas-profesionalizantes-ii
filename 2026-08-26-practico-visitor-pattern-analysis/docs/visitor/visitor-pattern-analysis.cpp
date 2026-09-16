// Practicas Profesionalizantes II - Unidad 01 - Practico 02 - Visitor Pattern Analysis
// Archivo unico de entrega didactica: replica fiel JS vs Visitor GoF canonico.
// Rutas relativas a 2026-08-26-practico-visitor-pattern-analysis/ en este repo.
// Base JS:
//   backend/utils/validation_handler/validation_handler.js (isValid:19, validateThis:30, with:39-40)
//   backend/utils/validation_handler/validations/email.js (evaluate:14, validate:21)
//   backend/utils/language_manager/language_manager.js:64 (getThisMessage)
//   backend/utils/language_manager/locales/es.json, en.json
// Teoria: Vault conocimiento, subjects/algoritmos-y-estructuras-de-datos-ii/20-topics/visitor.md
//   (fuera de este repo; ejemplo canonico Dot/Circle/Rectangle + Drawing).
// Secuencia: docs/visitor/sequence-validation-handler-email.puml (mismo directorio)
//
// MAPEO REFACTORING.GURU / GoF vs JS REAL (veredicto: NO es Visitor canonico):
// | Rol GoF (Refactoring.Guru)       | Esperado GoF                          | JS real                                      | Veredicto |
// |----------------------------------|---------------------------------------|----------------------------------------------|-----------|
// | Visitor (interfaz)               | visitEmail/visitCuit/visitPassword    | No existe. ValidationHandler solo tiene      | NO CUMPLE |
// |                                  |                                       | isValid/validateThis/with                    |           |
// | ConcreteVisitor (operacion)      | AreaCalculator/XmlExporter con estado | Un solo ValidationHandler sin visit*. La     | NO CUMPLE |
// |                                  | y logica por tipo                     | logica vive en Email.evaluate()              |           |
// | Element (interfaz)               | accept(Visitor&)                      | Contrato implicito evaluate()/validate()     | PARCIAL   |
// | ConcreteElement                  | accept(){ v.visitX(this); }           | validate() hace callback i18n, no anuncia    | PARCIAL   |
// |                                  |                                       | su tipo con visit*                           |           |
// | ObjectStructure                  | Drawing itera shapes->accept(v)       | No existe coleccion heterogenea; with()      | NO CUMPLE |
// |                                  |                                       | visita UN solo elemento                      |           |
// | Double dispatch                  | s->accept(v) -> v.visitX(this)        | with() inyecta this y delega validate();     | NO HAY    |
// |                                  |                                       | un solo despacho + callback i18n             |           |
// Patron real JS: Strategy (Email/Cuit/Password intercambiables via evaluate)
//   + Fluent Interface (validateThis().with()) + inyeccion de dependencia
//   (validationObject.validationHandler = this) para i18n via LanguageManager singleton.
//
// Este .cpp trae ambos para contrastar:
//   namespace faithful  -> replica 1:1 del JS (incluye sus defectos, documentados).
//   namespace canonical -> Visitor GoF puro con Email/Cuit/Password (las tres, a pedido).

#include <cstdio>
#include <iostream>
#include <memory>
#include <regex>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <vector>

// ---------------------------------------------------------------------------
// LanguageManager compartido (singleton como en language_manager.js:86-88).
// Recursos copiados de es.json / en.json. CT_INVALID_PASSWORD no existe en los
// JSON (solo EMAIL/CUIT/RESOURCE_CONSTANT): se agrega aqui como extension
// documentada, misma clave en ambos idiomas.
// ---------------------------------------------------------------------------
class LanguageManager {
public:
    static LanguageManager& instance() {
        static LanguageManager inst;
        return inst;
    }
    void setLanguage(const std::string& lang) {
        if (resources_.count(lang)) language_ = lang;
        else std::cerr << "Idioma '" << lang << "' no soportado. Se mantiene '"
                       << language_ << "'.\n";
    }
    const std::string& language() const { return language_; }
    std::string getMessage(const std::string& key) const {
        auto it = resources_.find(language_);
        const auto& dict = (it != resources_.end()) ? it->second
                                                    : resources_.at("es");
        auto m = dict.find(key);
        if (m == dict.end())
            throw std::runtime_error("Recurso de lenguaje invalido o clave inexistente"
                                     ". Detalles: La clave '" + key +
                                     "' no existe en '" + language_ + ".json'");
        return m->second;
    }

private:
    LanguageManager() : language_("es") {
        resources_["es"] = {
            {"CT_INVALID_EMAIL", "El formato de correo electronico no es valido"},
            {"CT_INVALID_CUIT", "El formato de cuit no es valido"},
            {"CT_INVALID_PASSWORD", "El formato de password no es valido"},
            {"CT_INVALID_RESOURCE_CONSTANT",
             "Recurso de lenguaje invalido o clave inexistente"},
        };
        resources_["en"] = {
            {"CT_INVALID_EMAIL", "Invalid email address format"},
            {"CT_INVALID_CUIT", "Invalid cuit format"},
            {"CT_INVALID_PASSWORD", "Invalid password format"},
            {"CT_INVALID_RESOURCE_CONSTANT",
             "Invalid language resource or missing key"},
        };
    }
    std::string language_;
    std::unordered_map<std::string,
                       std::unordered_map<std::string, std::string>>
        resources_;
};

// ===========================================================================
// PARTE 1: namespace faithful — replica 1:1 del JS.
// Defectos preservados a proposito y marcados con NOTA.
// ===========================================================================
namespace faithful {

class ValidationHandler; // forward (dependencia ciclica como en el doc de Visitor, sec. 2.4)

class Validation {
public:
    ValidationHandler* validationHandler = nullptr; // email.js:6 (null inicial)
    std::string messageName;
    explicit Validation(std::string msg) : messageName(std::move(msg)) {}
    virtual ~Validation() = default;
    virtual bool evaluate(const std::string& target) const = 0;
    virtual void validate(const std::string& target) = 0;
};

class ValidationHandler {
public:
    LanguageManager& languageManager = LanguageManager::instance();
    // NOTA: _target guarda estado mutable en el visitor (no thread-safe),
    // necesario solo para el encadenado fluent validateThis().with().
    std::string target_;

    // validation_handler.js:17 — variante stateless/pura.
    bool isValid(const std::string& target, Validation& v) {
        return v.evaluate(target);
    }
    // validation_handler.js:30 — guarda _target y retorna this.
    ValidationHandler* validateThis(const std::string& target) {
        target_ = target;
        return this;
    }
    // validation_handler.js:39-40 — "linea clave": inyecta this y delega.
    // NOTA: no hay accept/visit*; es un solo despacho + callback i18n.
    ValidationHandler* with(Validation& v) {
        v.validationHandler = this;
        v.validate(target_);
        return this;
    }
};

class Email : public Validation {
public:
    Email() : Validation("CT_INVALID_EMAIL") {}
    bool evaluate(const std::string& target) const override {
        // Regex copiado de email.js:17. NOTA: el `?` final hace que "" matchee
        // (pattern.test("") == true). Se preserva fiel; en canonical se corrige.
        static const std::regex pattern(
            R"(^([a-z0-9][a-z0-9_\.-]*[a-z0-9]@[a-z0-9][a-z0-9_\.-]*[a-z0-9][\.][a-z0-9]{2,4})?$)",
            std::regex::icase);
        return std::regex_match(target, pattern);
    }
    void validate(const std::string& target) override {
        if (!evaluate(target)) {
            // email.js:25 — callback al visitor para i18n.
            std::string msg =
                validationHandler->languageManager.getMessage(messageName);
            throw std::runtime_error(msg + ": " + target);
        }
    }
};

class Cuit : public Validation {
public:
    Cuit() : Validation("CT_INVALID_CUIT") {}
    // JS: cuit.js stub vacio (0 lineas). Regla documentada aqui:
    // formato XX-XXXXXXXX-X + digito verificador AFIP (serie 5 4 3 2 7 6 5 4 3 2).
    bool evaluate(const std::string& target) const override {
        std::string digits;
        for (char c : target)
            if (c >= '0' && c <= '9') digits.push_back(c);
        if (digits.size() != 11) return false;
        static const int serie[10] = {5, 4, 3, 2, 7, 6, 5, 4, 3, 2};
        int acc = 0;
        for (int i = 0; i < 10; ++i) acc += (digits[i] - '0') * serie[i];
        int resto = acc % 11;
        int verif = (resto == 0) ? 0 : (resto == 1 ? 9 : 11 - resto);
        return verif == (digits[10] - '0');
    }
    void validate(const std::string& target) override {
        if (!evaluate(target)) {
            std::string msg =
                validationHandler->languageManager.getMessage(messageName);
            throw std::runtime_error(msg + ": " + target);
        }
    }
};

class Password : public Validation {
public:
    Password() : Validation("CT_INVALID_PASSWORD") {}
    // JS: password.js stub vacio. Regla documentada: min 8, 1 mayus, 1 minus, 1 digito.
    bool evaluate(const std::string& target) const override {
        if (target.size() < 8) return false;
        bool up = false, low = false, dig = false;
        for (char c : target) {
            if (c >= 'A' && c <= 'Z') up = true;
            else if (c >= 'a' && c <= 'z') low = true;
            else if (c >= '0' && c <= '9') dig = true;
        }
        return up && low && dig;
    }
    void validate(const std::string& target) override {
        if (!evaluate(target)) {
            std::string msg =
                validationHandler->languageManager.getMessage(messageName);
            throw std::runtime_error(msg + ": " + target);
        }
    }
};

void demo() {
    std::printf("--- faithful (replica JS, 1 despacho + callback i18n) ---\n");
    ValidationHandler validator;
    Email email;
    Cuit cuit;
    Password pass;

    // isValid: stateless, sin throw ni i18n.
    std::printf("[faithful] isValid email ok=%d, bad=%d, empty=%d (NOTA: empty=true por el ? del regex JS)\n",
                (int)validator.isValid("contacto@ejemplo.com", email),
                (int)validator.isValid("no-es-mail", email),
                (int)validator.isValid("", email));

    // with: con efecto + i18n (es por defecto).
    validator.validateThis("contacto@ejemplo.com")->with(email);
    std::printf("[faithful] with(email valido) ok\n");
    try {
        validator.validateThis("no-es-mail")->with(email);
    } catch (const std::exception& e) {
        std::printf("[faithful] with(email invalido) throw es: %s\n", e.what());
    }
    LanguageManager::instance().setLanguage("en");
    try {
        validator.validateThis("no-es-mail")->with(email);
    } catch (const std::exception& e) {
        std::printf("[faithful] with(email invalido) throw en: %s\n", e.what());
    }
    LanguageManager::instance().setLanguage("es");

    // Cuit/Password (stubs en JS, implementados aqui con reglas documentadas).
    std::printf("[faithful] isValid cuit 20-12345678-6=%d, bad=%d\n",
                (int)validator.isValid("20-12345678-6", cuit),
                (int)validator.isValid("20-12345678-0", cuit));
    std::printf("[faithful] isValid pass Segura123=%d, bad=%d\n",
                (int)validator.isValid("Segura123", pass),
                (int)validator.isValid("corta", pass));
    try {
        validator.validateThis("corta")->with(pass);
    } catch (const std::exception& e) {
        std::printf("[faithful] with(pass invalida) throw: %s\n", e.what());
    }
}

} // namespace faithful

// ===========================================================================
// PARTE 2: namespace canonical — Visitor GoF puro.
// Diferencia clave vs faithful: la operacion vive en el VISITANTE (visit*),
// el elemento solo se anuncia con accept(){ v.visitX(this); } (doble despacho).
// ObjectStructure = ValidationSuite (equivale a Drawing en el doc de Visitor).
// ===========================================================================
namespace canonical {

class Email;
class Cuit;
class Password;

// Visitor: un visit* por ConcreteElement.
class Visitor {
public:
    virtual void visitEmail(const Email* e) = 0;
    virtual void visitCuit(const Cuit* c) = 0;
    virtual void visitPassword(const Password* p) = 0;
    virtual ~Visitor() = default;
};

// Element: solo expone accept.
class Validation {
public:
    virtual void accept(Visitor& v) const = 0;
    virtual ~Validation() = default;
};

class Email : public Validation {
public:
    std::string value;
    explicit Email(std::string v) : value(std::move(v)) {}
    void accept(Visitor& v) const override { v.visitEmail(this); } // 2do despacho
};

class Cuit : public Validation {
public:
    std::string value;
    explicit Cuit(std::string v) : value(std::move(v)) {}
    void accept(Visitor& v) const override { v.visitCuit(this); }
};

class Password : public Validation {
public:
    std::string value;
    explicit Password(std::string v) : value(std::move(v)) {}
    void accept(Visitor& v) const override { v.visitPassword(this); }
};

// Reglas puras (sin lanzar): reutilizables por cualquier visitor.
namespace rules {
inline bool email(const std::string& t) {
    // Corregido: exige al menos 1 caracter (sin el `?` que aceptaba "" en JS).
    static const std::regex pattern(
        R"(^[a-z0-9][a-z0-9_\.-]*[a-z0-9]@[a-z0-9][a-z0-9_\.-]*[a-z0-9]\.[a-z0-9]{2,4}$)",
        std::regex::icase);
    return std::regex_match(t, pattern);
}
inline bool cuit(const std::string& t) {
    std::string d;
    for (char c : t)
        if (c >= '0' && c <= '9') d.push_back(c);
    if (d.size() != 11) return false;
    static const int serie[10] = {5, 4, 3, 2, 7, 6, 5, 4, 3, 2};
    int acc = 0;
    for (int i = 0; i < 10; ++i) acc += (d[i] - '0') * serie[i];
    int resto = acc % 11;
    int verif = (resto == 0) ? 0 : (resto == 1 ? 9 : 11 - resto);
    return verif == (d[10] - '0');
}
inline bool password(const std::string& t) {
    if (t.size() < 8) return false;
    bool up = false, low = false, dig = false;
    for (char c : t) {
        if (c >= 'A' && c <= 'Z') up = true;
        else if (c >= 'a' && c <= 'z') low = true;
        else if (c >= '0' && c <= '9') dig = true;
    }
    return up && low && dig;
}
} // namespace rules

// ConcreteVisitor 1: version bool (equivale a isValid, pero la logica esta AQUI).
class BoolValidator : public Visitor {
public:
    bool ok = true;
    void visitEmail(const Email* e) override { ok = rules::email(e->value); }
    void visitCuit(const Cuit* c) override { ok = rules::cuit(c->value); }
    void visitPassword(const Password* p) override {
        ok = rules::password(p->value);
    }
};

// ConcreteVisitor 2: version con efecto i18n (equivale a with(), logica AQUI).
class ThrowingValidator : public Visitor {
public:
    LanguageManager& lm = LanguageManager::instance();
    void visitEmail(const Email* e) override {
        if (!rules::email(e->value))
            throw std::runtime_error(lm.getMessage("CT_INVALID_EMAIL") +
                                     ": " + e->value);
    }
    void visitCuit(const Cuit* c) override {
        if (!rules::cuit(c->value))
            throw std::runtime_error(lm.getMessage("CT_INVALID_CUIT") + ": " +
                                     c->value);
    }
    void visitPassword(const Password* p) override {
        if (!rules::password(p->value))
            throw std::runtime_error(lm.getMessage("CT_INVALID_PASSWORD") +
                                     ": " + p->value);
    }
};

// ObjectStructure (equivale a Drawing en el doc de Visitor).
class ValidationSuite {
    std::vector<std::unique_ptr<Validation>> items_;

public:
    void add(std::unique_ptr<Validation> v) {
        items_.push_back(std::move(v));
    }
    void accept(Visitor& v) const {
        for (const auto& it : items_) it->accept(v); // 1er despacho (virtual)
    }
};

void demo() {
    std::printf("--- canonical (Visitor GoF, doble despacho) ---\n");
    ValidationSuite suite;
    suite.add(std::make_unique<Email>("contacto@ejemplo.com"));
    suite.add(std::make_unique<Cuit>("20-12345678-6"));
    suite.add(std::make_unique<Password>("Segura123"));

    ThrowingValidator throwing; // no lanza: todo valido
    suite.accept(throwing);
    std::printf("[canonical] suite valida: ThrowingValidator no lanzo\n");

    BoolValidator b;
    Email bad("no-es-mail");
    bad.accept(b); // accept -> visitEmail (2do despacho por sobrecarga)
    std::printf("[canonical] BoolValidator email malo ok=%d\n", (int)b.ok);

    ValidationSuite badSuite;
    badSuite.add(std::make_unique<Email>("no-es-mail"));
    try {
        badSuite.accept(throwing);
    } catch (const std::exception& e) {
        std::printf("[canonical] suite invalida throw: %s\n", e.what());
    }

    // Agregar operacion nueva = clase nueva, sin tocar Email/Cuit/Password
    // (OCP pro-operaciones). Agregar elemento nuevo = tocar Visitor + todos
    // los visitors (costo pro-elementos). Ese es el trade-off central GoF.
}

} // namespace canonical

int main() {
    std::printf("Visitor Pattern Analysis — fiel vs canonico (Email/Cuit/Password)\n");
    faithful::demo();
    canonical::demo();
    std::printf("Conclusion: JS = Strategy+Fluent+i18n (1 despacho). "
                "C++ canonical = Visitor GoF (2 despachos: accept virtual + visit*).\n");
    return 0;
}
