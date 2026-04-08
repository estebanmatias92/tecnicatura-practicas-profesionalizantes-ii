/**
*    Project     : Sample Vault
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const fileHelper = require('../utils/fileHelper');
const sampleRepo = require('../repositories/sampleRepo');

class SampleController 
{
    // Método para subir un sample y guardarlo en la BD
    async uploadSample(req, res) 
    {
        try
        {
            if (!req.file)
            {
                return res.status(400).json({ message: "No file uploaded or invalid format" });
            }

            const { display_name, category, bpm } = req.body;
            const userId = req.userId; // Obtenido del token JWT por el middleware
            const filename = req.file.filename;
            const filePath = `/uploads/${filename}`; // Ruta relativa para el frontend

            // Guardar metadatos en la base de datos
            await sampleRepo.create({
                user_id: userId,
                filename,
                display_name,
                category,
                bpm: bpm || 0,
                file_path: filePath
            });

            res.status(201).json({ message: "Sample uploaded successfully", path: filePath });
        }
        catch (error)
        {
            res.status(500).json({ message: "Upload error", error: error.message });
        }
    }

    // Listar samples del usuario logueado
    async getMySamples(req, res)
    {
        try
        {
            const samples = await sampleRepo.findByUserId(req.userId);
            res.json(samples);
        }
        catch (error)
        {
            res.status(500).json({ message: "Error fetching samples", error: error.message });
        }
    }

    async deleteSample(req, res) 
    {
        try 
        {
            const { id } = req.params;

            // 1. Buscar el sample ANTES de borrarlo para tener la ruta del archivo
            const sample = await sampleRepo.findById(id, req.userId);
            if (!sample) return res.status(404).json({ message: "Sample no encontrado" });
    
            // 2. Borrar el registro de la base de datos
            const success = await sampleRepo.delete(id, req.userId);
    
            if (success) 
            {
                // El util o wrapper fileHelper 
                // se encarga de la "magia" de las rutas al borrar
                fileHelper.deleteFile(sample.file_path); 
                
                return res.json({ message: "Biblioteca actualizada y sample eliminado." });
            }
        }
        catch (error)
        {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new SampleController();