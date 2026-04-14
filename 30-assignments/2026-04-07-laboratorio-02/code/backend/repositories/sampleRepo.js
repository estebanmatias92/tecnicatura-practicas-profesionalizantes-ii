/**
*    Project     : Sample Vault
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const db = require('../config/db');

class SampleRepository 
{
    // Insertar un nuevo registro de sample
    async create(sampleData) 
    {
        const { user_id, filename, display_name, category, bpm, file_path } = sampleData;
        const sql = `INSERT INTO samples (user_id, filename, display_name, category, bpm, file_path) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await db.execute(sql, [user_id, filename, display_name, category, bpm, file_path]);
        return result.insertId;
    }

    // Obtener todos los samples de un productor específico
    async findByUserId(userId) 
    {
        const [rows] = await db.execute('SELECT * FROM samples WHERE user_id = ?', [userId]);
        return rows;
    }

    // Método para buscar y obtener un sample id de sample y user_id
    async findById(id, userId) 
    {
        const [rows] = await db.execute(
            'SELECT * FROM samples WHERE id = ? AND user_id = ?', 
            [id, userId]
        );
        return rows[0]; // Retorna el sample completo o undefined
    }

    // Eliminar un sample (se usará en el CRUD de borrado)
    async delete(id, userId) 
    {
        const [result] = await db.execute('DELETE FROM samples WHERE id = ? AND user_id = ?', [id, userId]);
        return result.affectedRows > 0;
    }
}

module.exports = new SampleRepository();