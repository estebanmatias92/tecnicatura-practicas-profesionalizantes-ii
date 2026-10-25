import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(3306),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_LOGGING: Joi.boolean().default(false),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  BCRYPT_COST: Joi.number().integer().min(4).max(15).default(10),

  UPLOAD_DIR: Joi.string().default('./uploads'),
  MAX_FILE_SIZE_MB: Joi.number().integer().min(1).max(200).default(50),

  ADMIN_EMAIL: Joi.string().email({ tlds: { allow: false } }).optional(),
  ADMIN_PASSWORD: Joi.string().optional(),
  CORS_ORIGIN: Joi.string().allow('').optional(),
});
