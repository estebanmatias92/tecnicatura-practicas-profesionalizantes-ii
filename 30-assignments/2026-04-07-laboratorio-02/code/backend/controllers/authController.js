/**
*    Project     : Sample Vault
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

const bcrypt = require('bcrypt'); // Biblioteca para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens de sesión
const userRepo = require('../repositories/userRepo'); // Importamos el repositorio de usuarios

/**
 * Deserialización moderna: "Del objeto que devuelve este require, buscá la propiedad que se 
 * llame exactamente SECRET_KEY y creá una constante con ese mismo nombre y valor".
 *  */ 
const { SECRET_KEY } = require('../middleware/authMiddleware'); 

class AuthController 
{
    // Método para registrar un nuevo productor
    async register(req, res) 
    {

        try 
        {
            const { username, password } = req.body; // Extraemos datos del cuerpo de la petición

            // Encriptamos la contraseña con un costo de 10 saltos
            const hashedPassword = await bcrypt.hash(password, 10);            
            
            // Guardamos en la base de datos a través del repositorio
            const userId = await userRepo.create(username, hashedPassword, 'producer');
            
            res.status(201).json({ message: "User registered successfully", userId });
        }
        catch (error)
        {
            res.status(500).json({ message: "Error registering user", error: error.message });
        }
    }

    // Método para iniciar sesión
    async login(req, res) 
    {
        try
        {
            const { username, password } = req.body;
            const user = await userRepo.findByUsername(username);

            // Si el usuario no existe o la contraseña no coincide
            if (!user || !(await bcrypt.compare(password, user.password)))
            {
                console.log("Invalid credentials");
                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Generamos el token incluyendo el ID y el Rol (expira en 2 horas)
            const token = jwt.sign(
                { id: user.id, role: user.role }, 
                SECRET_KEY, 
                { expiresIn: '2h' }
            );

            res.json({ message: "Login successful", token, role: user.role });
        }
        catch (error)
        {
            res.status(500).json({ message: "Login error", error: error.message });
        }
    }
}

module.exports = new AuthController();