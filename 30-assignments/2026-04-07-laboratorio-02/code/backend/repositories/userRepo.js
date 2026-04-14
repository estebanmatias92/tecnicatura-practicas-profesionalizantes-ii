/**
*    Project     : Sample Vault
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const db = require('../config/db');

class UserRepository 
{
    // Buscar un usuario por su nombre de usuario (útil para el login)
    async findByUsername(username) 
    {
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

        return rows[0]; // Retorna el primer usuario encontrado o undefined
    }

    // Crear un nuevo usuario en la base de datos
    async create(username, hashedPassword, role = 'producer') 
    {
        const [result] = await db.execute(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, hashedPassword, role]
        );
        return result.insertId; // Retorna el ID generado
    }
    
    //obtener todos los usuarios
    async findAll()
    { 
        const [rows] = await db.execute('SELECT id, username, role, created_at FROM users'); 
        return rows; 
    }

    //borrar un usuario
    async delete(id) 
    {
        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = new UserRepository();
