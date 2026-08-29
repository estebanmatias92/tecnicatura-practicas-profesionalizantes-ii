class Email 
{
    constructor(messageName = "CT_INVALID_EMAIL")
    {
        this._messageName = messageName;
        this.validationHandler = null;
    }

    set messageName(name)
    {
        this._messageName = name;
    }

    evaluate(target)
    {
        if (typeof target !== 'string') return false;
        const pattern = /^([a-z0-9][a-z0-9_\.-]{0,}[a-z0-9]@[a-z0-9][a-z0-9_\.-]{0,}[a-z0-9][\.][a-z0-9]{2,4})?$/i;
        return pattern.test(target);
    }

    validate(target)
    {
        if (!this.evaluate(target))
        {
            const message = this.validationHandler.languageManager.getThisMessage(this._messageName);
            throw new Error(`${message}: ${target}`);
        }
    }
}

module.exports = Email;