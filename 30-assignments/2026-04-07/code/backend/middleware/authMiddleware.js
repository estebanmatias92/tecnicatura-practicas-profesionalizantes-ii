/**
*    Project     : Sample Vault
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Marzo 2026
*/

/**
 * JSON Web Token (JWT) es un estándar abierto (RFC 7519) compacto 
 * y seguro para transmitir información entre partes como un objeto JSON. 
 * Se utiliza principalmente para autenticación y autorización en 
 * aplicaciones web, permitiendo verificar la integridad de los datos 
 * mediante una firma digital (con clave secreta o par RSA)
 */
const jwt = require('jsonwebtoken');
// En producción, siempre usar variables de entorno (.env):
const SECRET_KEY = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';

const authMiddleware = {
    // 0. Agregar SECRET_KEY para que sea accesible al importar el objeto authMiddleware
    SECRET_KEY,

    // 1. Verifica que el usuario esté logueado
    verifyToken: (req, res, next) => {
        // Obtener el token del encabezado de la petición:
        const token = req.headers['authorization'];
        if (!token) return res.status(403).json({ message: "No se proporcionó un token." });

        // El token suele venir como "Bearer <token>", aquí quitamos el "Bearer ":
        const pureToken = token.split(" ")[1];

        jwt.verify(pureToken, SECRET_KEY, (err, decoded) => {
            if (err) return res.status(401).json({ message: "Token inválido o expirado." });
            
            // Guardamos la info del usuario decodificada en el request para usarla después:
            req.userId = decoded.id;
            req.userRole = decoded.role; // Extraemos el rol del token
            next(); // Continuar al siguiente controlador o middleware
        });
    },

    // 2. Verifica si el usuario tiene privilegios de Admin
    // Importante: Este middleware debe ir DESPUÉS de verifyToken en las rutas
    isAdmin: (req, res, next) => {
        if (req.userRole !== 'admin') {
            return res.status(403).json({ 
                message: "Acceso denegado: Se requiere rol de Administrador." 
            });
        }
        next();
    }
};

module.exports = authMiddleware;