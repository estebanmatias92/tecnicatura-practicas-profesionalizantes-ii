const languageManager = require('../language_manager/language_manager');

class ValidationHandler 
{
    constructor()
    {
        this.languageManager = languageManager;
        this._target = null;
    }

    /**
     * 
     * @param {*} target es el objeto objetivo, es lo que se va a evaluar.
     * @param {*} validationObject es el objeto Validation, quien va a evaluar.
     * @returns un booleano.
     */
    isValid(target, validationObject)
    {
        return validationObject.evaluate(target);
    }

/**
 * 
 * @abstract Estos dos métodos a continuación se usan combinados y la
 * diferencia con isValid es que lanzan una excepción y 
 * retornan un mensaje con soporte multi-idioma.
 * Uso: 
 *      validator.validateThis("contacto@ejemplo.com").with(new Email());
 */
    validateThis(target)
    {
        this._target = target;
        return this;
    }

    // Delegación y composición: ValidationHandler actúa como Visitante
    with(validationObject)
    {
        validationObject.validationHandler = this; //línea clave, acá está el visitor
        validationObject.validate(this._target);
        return this;
    }
}

module.exports = ValidationHandler;