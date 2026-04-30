import { resolve } from 'node:path'
import database from 'infra/database.js'
import { runner as migrationRunner } from 'node-pg-migrate'
import { ServiceError } from 'infra/error'

const defaultOptions = {
  dir: resolve('infra', 'migrations'),
  direction: 'up',
  verbose: true,
  migrationsTable: 'pgmigrations',
  dryRun: true,
}

async function listPendingMigrations() {
  let dbClient

  try {
    dbClient = await database.getNewClient()
    const pendingMigrations = await migrationRunner({
      ...defaultOptions,
      dbClient,
    })

    return pendingMigrations
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      cause: error,
      message: 'Ocorreu um erro ao consultar as migrações.',
    })

    throw serviceErrorObject
  } finally {
    await dbClient?.end()
  }
}

async function runPendingMigrations() {
  let dbClient

  try {
    dbClient = await database.getNewClient()

    const migratedMigrations = await migrationRunner({
      ...defaultOptions,
      dbClient,
      dryRun: false,
    })

    return migratedMigrations
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      cause: error,
      message: 'Ocorreu um erro ao rodar as migrações.',
    })

    throw serviceErrorObject
  } finally {
    await dbClient?.end()
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
}

export default migrator
