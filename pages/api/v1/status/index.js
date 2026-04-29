import database from 'infra/database.js'
import { InternalServerError, MethodNotAllowedError } from 'infra/error'
import { createRouter } from 'next-connect'
import controller from 'infra/controller'

const router = createRouter()

router.get(getHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
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
}
