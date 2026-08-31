import orchestrator from 'tests/orchestrator.js'
import { beforeAll, describe, expect, test } from 'vitest'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.runPendingMigrations()
})

describe('GET /api/v1/status', () => {
  describe('Anonymous user', () => {
    test('Getting the system status', async () => {
      const response = await fetch('http://localhost:3000/api/v1/status')
      expect(response.status).toBe(200)

      const responseBody = await response.json()

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString()

      expect(responseBody.updated_at).toEqual(parsedUpdatedAt)
      expect(responseBody.dependencies.database.database_version).toBe('')
      expect(responseBody.dependencies.database.max_connections).toBe(100)
      expect(responseBody.dependencies.database.current_connections).toBe(1)
      expect(responseBody.dependencies.database).not.toHaveProperty('version')
    })
  })

  describe('Privileged user', () => {
    test('Getting the system status', async () => {
      const user = await orchestrator.createUser()
      await orchestrator.activateUserById(user.id)
      await orchestrator.addFeaturesToUser(user.id, ['read:status:all'])
      const sessionObject = await orchestrator.createSession(user.id)

      const response = await fetch('http://localhost:3000/api/v1/status', {
        headers: {
          cookie: `session_id=${sessionObject.token}`,
        },
      })
      expect(response.status).toBe(200)

      const responseBody = await response.json()

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString()

      expect(responseBody.updated_at).toEqual(parsedUpdatedAt)
      expect(responseBody.dependencies.database.database_version).toBe('16.0')
      expect(responseBody.dependencies.database.max_connections).toBe(100)
      expect(responseBody.dependencies.database.current_connections).toBe(1)
    })
  })
})
