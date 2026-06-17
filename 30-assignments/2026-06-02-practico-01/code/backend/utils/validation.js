function validateInput(str) {
    if (typeof str !== 'string') return null;

    const INJECTION_PATTERN = /['"]\s*(OR|AND)\s+\d+\s*=\s*\d+|['"]\s*;\s*(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE)|<script[^>]*>/i;

    if (INJECTION_PATTERN.test(str)) {
        return "Caracteres no permitidos en la entrada.";
    }

    return null;
}

module.exports = { validateInput };
