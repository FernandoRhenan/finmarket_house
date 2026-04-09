import migrationRunner from 'node-pg-migrate'
import database from 'infra/database.js'
import { join } from 'node:path'

export default async function migrations(request, response) {

  if (request.method !== 'POST' || request.method !== 'GET') return response.status(405).end()

  const dbClient = await database.getNewClient()

  const defaultOptions = {
    dbClient: dbClient,
    dir: join('infra', 'migrations'),
    direction: 'up',
    verbose: true,
    migrationsTable: 'pgmigrations',
    dryRun: true
  }

  if (request.method === 'GET') {
    const pendingMigrations = await migrationRunner(defaultOptions)
    await dbClient.end()
    return response.status(200).json(pendingMigrations)
  }

  if (request.method === 'POST') {
    const migratedMigrations = await migrationRunner({ ...defaultOptions, dryRun: false })

    await dbClient.end()

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations)
    } else {
      return response.status(200).json(migratedMigrations)
    }
  }
}
