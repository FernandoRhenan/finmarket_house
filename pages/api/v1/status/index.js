import database from 'infra/database.js'
import { InternalServerError } from 'infra/error'

async function status(request, response) {
  try {
    const databaseName = process.env.POSTGRES_DB
    const updatedAt = new Date().toISOString()
    const databaseVersion = await database.query('SHOW server_version;')
    const maxConnections = await database.query('SHOW max_connections;')

    const currentConnections = await database.query({
      text: 'SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;',
      values: [databaseName],
    })

    response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          database_version: databaseVersion.rows[0].server_version,
          max_connections: parseInt(maxConnections.rows[0].max_connections),
          current_connections: currentConnections.rows[0].count,
        },
      },
    })
  } catch (error) {
    console.log('\nErro no controller status\n')
    const publicErrorObject = new InternalServerError({
      cause: error,
    })

    console.error(publicErrorObject)
    response.status(500).json(publicErrorObject)
  }
}

export default status
