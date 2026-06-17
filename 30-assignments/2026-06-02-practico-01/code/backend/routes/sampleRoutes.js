/**
*    Project     : Sample Vault
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const express = require('express');
const router = express.Router();
const sampleController = require('../controllers/sampleController');

//configuración de Multer para subir archivos de audio:
const uploadMiddleware = require('../config/multerConfig');

const { verifyToken } = require('../middleware/authMiddleware');

const { MAX_FILE_SIZE } = require('../config/constants');

// Todas las rutas de samples requieren que el usuario esté logueado
router.use(verifyToken);

// Subir un nuevo audio: POST /api/samples/upload
// 'audioFile' es el nombre que debe tener el campo file en el FormData del frontend
router.post('/upload', (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ message: `El archivo excede el límite de ${MAX_FILE_SIZE / (1024 * 1024)} MB.` });
            }
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, sampleController.uploadSample);

// Listar mis samples: GET /api/samples/my-samples
router.get('/my-samples', sampleController.getMySamples);

// Eliminar un sample: DELETE /api/samples/:id
router.delete('/:id', sampleController.deleteSample);

module.exports = router;