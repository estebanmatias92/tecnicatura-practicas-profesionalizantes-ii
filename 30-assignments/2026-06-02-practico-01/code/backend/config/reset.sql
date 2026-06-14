SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE samples;
TRUNCATE TABLE users_roles;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO roles (name) VALUES ('admin'), ('producer');
INSERT INTO users (id, username, password) VALUES
    (1, 'admin', '$2b$10$.n0s847tiSxBqDvIo6Vg5ujXC5zIUmm98bTjBWnRdqX9CxxbIo7wS'),
    (2, 'pepe', '$2b$10$.n0s847tiSxBqDvIo6Vg5ujXC5zIUmm98bTjBWnRdqX9CxxbIo7wS');
INSERT INTO users_roles (user_id, role_id) VALUES (1, 1), (2, 2);
