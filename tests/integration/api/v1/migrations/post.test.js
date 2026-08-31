import webserver from 'infra/webserver'
import orchestrator from 'tests/orchestrator.js'
import { beforeAll, describe, expect, test } from 'vitest'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.cleanDatabase()
  await orchestrator.runPendingMigrations()
})

describe('POST /api/v1/migrations', () => {
  describe('Anonymous user', () => {
    test('Running pending migrations', async () => {
      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        method: 'POST',
      })

      expect(response.status).toBe(403)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        name: 'ForbiddenError',
        message: 'Você não possui permissão para executar esta ação.',
        action: 'Tente novamente quando tiver permissão.',
        status_code: 403,
      })
    })
  })

  describe('Default user', () => {
    test('Running pending migrations', async () => {
      const createdUser = await orchestrator.createUser()
      const activatedUser = await orchestrator.activateUserById(createdUser.id)
      const sessionObject = await orchestrator.createSession(activatedUser.id)

      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        method: 'POST',
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(403)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        name: 'ForbiddenError',
        message: 'Você não possui permissão para executar esta ação.',
        action: 'Tente novamente quando tiver permissão.',
        status_code: 403,
      })
    })
  })

  describe('Privileged user', () => {
    test('With `create:migration`', async () => {
      const createdUser = await orchestrator.createUser()
      const activatedUser = await orchestrator.activateUserById(createdUser.id)
      await orchestrator.addFeaturesToUser(createdUser.id, ['create:migration'])
      const sessionObject = await orchestrator.createSession(activatedUser.id)

      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        method: 'POST',
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      })

      expect(response.status).toBe(200)

      const responseBody = await response.json()

      expect(Array.isArray(responseBody)).toBe(true)
    })
  })
})
