const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

class TestController {
    async resetState(req, res) {
        let connection;
        try {
            const uploadDir = path.join(__dirname, '../uploads');

            connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASS,
                database: process.env.DB_NAME,
                multipleStatements: true
            }).promise();

            const sqlPath = path.join(__dirname, '../config/reset.sql');
            const sql = fs.readFileSync(sqlPath, 'utf8');
            await connection.query(sql);

            if (fs.existsSync(uploadDir)) {
                const files = fs.readdirSync(uploadDir);
                for (const file of files) {
                    const filePath = path.join(uploadDir, file);
                    if (fs.lstatSync(filePath).isFile()) {
                        fs.unlinkSync(filePath);
                    }
                }
            }

            res.json({ message: "Estado de prueba restablecido correctamente" });
        } catch (error) {
            console.error("Error al resetear estado:", error);
            res.status(500).json({ message: "Error al resetear estado", error: error.message });
        } finally {
            if (connection) await connection.end();
        }
    }
}

module.exports = new TestController();
