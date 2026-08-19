/**
*    Project     : Sample Vault
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * Importación del módulo multer
 * Multer es un middleware de Node.js diseñado para Express, 
 * esencial para manejar la carga de archivos (imágenes, documentos, etc.)
 * enviados en formato multipart/form-data. Simplifica la gestión 
 * de archivos al permitir configuraciones de almacenamiento en disco 
 * o memoria, filtrado de tipos y límites de tamaño, añadiendo un objeto
 * file o files al objeto request.
 */
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// 1. Definimos la ruta absoluta al directorio de subidas
// process.cwd() apunta a la raíz del proyecto donde se ejecutó 'node'
const uploadDir = path.join(process.cwd(), 'uploads');

// 2. Comprobación y creación de directorio en tiempo de inicialización
// Esto se ejecuta UNA SOLA VEZ cuando el servidor arranca.
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 Directorio creado automáticamente: ${uploadDir}`);
}

// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Carpeta donde se guardarán físicamente
    },
    filename: (req, file, cb) => {
        // Renombramos el archivo: timestamp + nombre original para que sea único
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Filtro para aceptar solo formatos de audio compatibles con HTML5
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac'];
    if (allowedTypes.includes(file.mimetype))
    {
        cb(null, true);
    }
    else
    {
        cb(new Error('Invalid file type. Only MP3, WAV, OGG and FLAC are allowed.'), false);
    }
};

const upload = multer({ storage, fileFilter });

// 'audioFile' es el nombre del campo en el formulario
module.exports = upload.single('audioFile');