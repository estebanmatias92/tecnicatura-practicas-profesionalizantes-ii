/**
*    Project     : Sample Vault
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const userRepo = require('../repositories/userRepo');
const sampleRepo = require('../repositories/sampleRepo');
const fileHelper = require('../utils/fileHelper');

class AdminController 
{
    // Listar todos los usuarios
    async getAllUsers(req, res)
    {
        try
        {
            const users = await userRepo.findAll();
            res.json(users);
        }
        catch (error)
        {
            res.status(500).json({ error: error.message });
        }
    }

    // Eliminar al usuario y sus archivos
    async deleteUser(req, res)
    {
        try
        {
            const userId = req.params.id;

            // 1. Obtener la lista de todos los samples del usuario antes de borrarlo
            const userSamples = await sampleRepo.findByUserId(userId);

            // 2. Borrar cada archivo físico del disco
            userSamples.forEach(sample => {
                fileHelper.deleteFile(sample.file_path);
            });

            // 3. Borrar al usuario de la DB
            // Al borrar al usuario, el ON DELETE CASCADE eliminará los registros en la tabla samples automáticamente
            const success = await userRepo.delete(userId);

            if (success)
            {
                res.json({ 
                    message: `Usuario y ${userSamples.length} archivos eliminados correctamente.` 
                });
            }
            else
            {
                res.status(404).json({ message: "Usuario no encontrado" });
            }
        }
        catch (error)
        {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AdminController();