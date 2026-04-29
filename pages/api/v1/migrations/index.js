import { runner as migrationRunner } from 'node-pg-migrate'
import database from 'infra/database.js'
import { resolve } from 'node:path'
import { createRouter } from 'next-connect'
import controller from 'infra/controller'

const router = createRouter()

router.get(getHandler).post(postHandler)

export default router.handler(controller.errorHandlers)

async function getHandler(request, response) {
  let dbClient

  try {
    dbClient = await database.getNewClient()
    const defaultOptions = {
      dbClient: dbClient,
      dir: resolve('infra', 'migrations'),
      direction: 'up',
      verbose: true,
      migrationsTable: 'pgmigrations',
      dryRun: true,
    }
    const pendingMigrations = await migrationRunner(defaultOptions)
    return response.status(200).json(pendingMigrations)
  } finally {
    await dbClient.end()
  }
}

async function postHandler(request, response) {
  let dbClient

  try {
    dbClient = await database.getNewClient()
    const defaultOptions = {
      dbClient: dbClient,
      dir: resolve('infra', 'migrations'),
      direction: 'up',
      verbose: true,
      migrationsTable: 'pgmigrations',
      dryRun: false,
    }

    const migratedMigrations = await migrationRunner(defaultOptions)

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations)
    } else {
      return response.status(200).json(migratedMigrations)
    }
  } finally {
    await dbClient.end()
  }
}
