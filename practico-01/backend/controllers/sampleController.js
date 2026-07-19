/**
* Project     : Sample Vault
* Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
* License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
* Date        : Marzo 2026
*/

const path = require('path');
const fileHelper = require('../utils/fileHelper');
const sampleRepo = require('../repositories/sampleRepo');
const { BPM_MIN, BPM_MAX } = require('../config/constants');
const { validateInput } = require('../utils/validation');

class SampleController 
{
    // Método para subir un sample y guardarlo en la BD
    async uploadSample(req, res) 
    {
        try
        {
            // 1. Validación de archivo y datos obligatorios
            if (!req.file)
            {
                return res.status(400).json({ message: "No se subió ningún archivo o el formato es inválido." });
            }

            const absolutePath = path.join(process.cwd(), '/uploads/', req.file.filename);
            const detectedType = await fileHelper.detectFileType(absolutePath);
            if (detectedType !== req.file.mimetype) {
                fileHelper.deleteFile(`/uploads/${req.file.filename}`);
                return res.status(415).json({ message: "El tipo de archivo no coincide con su contenido real." });
            }

            const { display_name, category, bpm } = req.body;
            
            if (!display_name || !category) {
                // Si faltan datos, eliminamos el archivo físico para no dejar basura (Storage Efficiency)
                fileHelper.deleteFile(`/uploads/${req.file.filename}`);
                return res.status(400).json({ message: "El nombre y la categoría son obligatorios." });
            }

            // Validación de entrada contra SQL injection / XSS
            const nameError = validateInput(display_name);
            const catError = validateInput(category);
            if (nameError || catError) {
                fileHelper.deleteFile(`/uploads/${req.file.filename}`);
                return res.status(400).json({ message: nameError || catError });
            }

            const filename = req.file.filename;
            const filePath = `/uploads/${filename}`;

            // 2. Validación de BPM (NFR-006)
            let dbBpm = null;

            if (bpm !== undefined && bpm !== null && bpm !== '') {
                const bpmNum = parseInt(bpm, 10);

                if (isNaN(bpmNum)) {
                    fileHelper.deleteFile(filePath);
                    return res.status(400).json({ message: "El BPM debe ser un valor numérico." });
                }

                if (bpmNum < BPM_MIN || bpmNum > BPM_MAX) {
                    fileHelper.deleteFile(filePath);
                    return res.status(400).json({ message: `El BPM debe estar entre ${BPM_MIN} y ${BPM_MAX}.` });
                }

                dbBpm = bpmNum;
            }

            const userId = req.userId; // Proveniente del verifyToken

            // 3. Persistencia mediante el SP sp_create_sample
            const insertId = await sampleRepo.create({
                user_id: userId,
                filename,
                display_name,
                category,
                bpm: dbBpm,
                file_path: filePath
            });

            res.status(201).json({ 
                message: "Sample cargado exitosamente en la biblioteca.", 
                id: insertId,
                path: filePath 
            });
        }
        catch (error)
        {
            // En caso de error de DB, intentar limpiar el archivo físico
            if (req.file) fileHelper.deleteFile(`/uploads/${req.file.filename}`);
            
            res.status(500).json({ message: "Error durante la carga del sample.", error: error.message });
        }
    }

    // Listar samples del productor logueado
    async getMySamples(req, res)
    {
        try
        {
            // El SP sp_find_samples_by_user filtra automáticamente por user_id
            const samples = await sampleRepo.findByUserId(req.userId);
            res.json(samples);
        }
        catch (error)
        {
            res.status(500).json({ message: "Error al recuperar la biblioteca.", error: error.message });
        }
    }

    // Eliminar un sample de la biblioteca
    async deleteSample(req, res) 
    {
        try 
        {
            const { id } = req.params;
            const userId = req.userId;
            const userRole = req.userRole;

            // 1. Verificar que el sample existe (sin filtro de dueño)
            const sampleExists = await sampleRepo.findByIdOnly(id);
            
            if (!sampleExists) {
                return res.status(404).json({ message: "El sample solicitado no existe." });
            }

            // 2. Si no es admin, verificar propiedad
            const isAdmin = userRole === 'admin';
            if (!isAdmin) {
                const sample = await sampleRepo.findById(id, userId);
                if (!sample) {
                    return res.status(403).json({ message: "No tienes permisos para eliminar este sample." });
                }
            }

            // 3. Admin elimina con el ID del dueño real; no-admin con su propio ID
            const ownerId = isAdmin ? sampleExists.user_id : userId;
            await sampleRepo.delete(id, ownerId);

            // 4. Eliminación física del archivo (Gestión de recursos)
            fileHelper.deleteFile(sampleExists.file_path); 
            
            return res.json({ message: "Registro eliminado y archivo físico removido con éxito." });
        }
        catch (error)
        {
            res.status(500).json({ message: "Error al eliminar el sample.", error: error.message });
        }
    }
}

module.exports = new SampleController();
