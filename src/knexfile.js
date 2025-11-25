// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  production: {
    client: 'postgresql',
    connection: {
      database: 'postgres_db',
      user:     'admin',
      password: 'admin',
      host: 'localhost',
      port: 5434
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
