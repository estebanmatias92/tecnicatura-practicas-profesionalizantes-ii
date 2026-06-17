const constants = {
    // Archivos
    MAX_FILE_SIZE: 10 * 1024 * 1024 + 1,  // 10 MB (+1 por límite exclusivo de busboy)
    ALLOWED_MIME_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac'],

    // Seguridad
    PASSWORD_MIN_LENGTH: 8,
    BCRYPT_SALT_ROUNDS: 10,

    // BPM (para NFR-006)
    BPM_MIN: 20,
    BPM_MAX: 300,
};

module.exports = constants;
