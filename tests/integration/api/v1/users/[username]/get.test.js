import { version as uuidVersion } from 'uuid'
import orchestrator from 'tests/orchestrator.js'
import { beforeAll, describe, expect, test } from 'vitest'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.cleanDatabase()
  await orchestrator.runPendingMigrations()
})

describe('GET /api/v1/users/[username]', () => {
  describe('Anonymous user', () => {
    test('With exact case match', async () => {
      const response1 = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'mesmoCase',
          email: 'mesmocase@email.com',
          password: 'senha111',
        }),
      })

      expect(response1.status).toBe(201)

      const response2 = await fetch(
        'http://localhost:3000/api/v1/users/mesmoCase'
      )

      expect(response2.status).toBe(200)

      const response2Body = await response2.json()

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: 'mesmoCase',
        email: 'mesmocase@email.com',
        password: 'senha111',
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      })

      expect(uuidVersion(response2Body.id)).toBe(4)
      expect(Date.parse(response2Body.created_at)).not.toBeNaN()
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN()
    })

    test('With case mismatch', async () => {
      const response1 = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'CaseDiferente',
          email: 'casediferente@email.com',
          password: 'senha111',
        }),
      })

      expect(response1.status).toBe(201)

      const response2 = await fetch(
        'http://localhost:3000/api/v1/users/caseDiferente'
      )

      expect(response2.status).toBe(200)

      const response2Body = await response2.json()
      expect(response2Body).toEqual({
        id: response2Body.id,
        username: 'CaseDiferente',
        email: 'casediferente@email.com',
        password: 'senha111',
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      })

      expect(uuidVersion(response2Body.id)).toBe(4)
      expect(Date.parse(response2Body.created_at)).not.toBeNaN()
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN()
    })

    test('With nonexistent username', async () => {
      const response1 = await fetch(
        'http://localhost:3000/api/v1/users/naoexistente'
      )

      expect(response1.status).toBe(404)

      const response1Body = await response1.json()
      expect(response1Body).toEqual({
        name: 'NotFoundError',
        message: 'O username informado não foi encontrado no sistema.',
        action: 'Verifique se o username está digitado corretamente.',
        status_code: 404,
      })
    })
  })
})
