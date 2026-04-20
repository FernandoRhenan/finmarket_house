import { runner as migrationRunner } from 'node-pg-migrate'
import database from 'infra/database.js'
import { join } from 'node:path'

export default async function migrations(request, response) {
  const methodsAllowed = ['GET', 'POST']
  if (!methodsAllowed.includes(request.method))
    return response.status(405).end()

  let dbClient

  try {
    dbClient = await database.getNewClient()
    const defaultOptions = {
      dbClient: dbClient,
      dir: join('infra', 'migrations'),
      direction: 'up',
      verbose: true,
      migrationsTable: 'pgmigrations',
      dryRun: true,
    }

    if (request.method === 'GET') {
      const pendingMigrations = await migrationRunner(defaultOptions)
      return response.status(200).json(pendingMigrations)
    }

    if (request.method === 'POST') {
      const migratedMigrations = await migrationRunner({
        ...defaultOptions,
        dryRun: false,
      })

      if (migratedMigrations.length > 0) {
        return response.status(201).json(migratedMigrations)
      } else {
        return response.status(200).json(migratedMigrations)
      }
    }
  } catch (e) {
    console.error(e)
    throw e
  } finally {
    await dbClient.end()
  }
}
