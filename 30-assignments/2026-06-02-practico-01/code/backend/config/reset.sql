SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE samples;
TRUNCATE TABLE users_roles;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;
SET FOREIGN_KEY_CHECKS = 1;

CALL sp_seed_roles();
CALL sp_create_user('admin', '$2b$10$.n0s847tiSxBqDvIo6Vg5ujXC5zIUmm98bTjBWnRdqX9CxxbIo7wS', 'admin');
CALL sp_create_user('pepe', '$2b$10$.n0s847tiSxBqDvIo6Vg5ujXC5zIUmm98bTjBWnRdqX9CxxbIo7wS', 'producer');
