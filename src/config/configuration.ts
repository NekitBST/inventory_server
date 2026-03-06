export default () => ({
  port: parseInt(process.env.PORT as string, 10),

  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT as string, 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT as string, 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB as string, 10),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    refreshTtlSeconds: parseInt(
      process.env.JWT_REFRESH_TTL_SECONDS as string,
      10,
    ),
  },
});
