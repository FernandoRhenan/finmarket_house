import { version as uuidVersion } from 'uuid'
import orchestrator from 'tests/orchestrator.js'
import sessions from 'models/session.js'
import { beforeAll, describe, expect, test } from 'vitest'
import setCookieParser from 'set-cookie-parser'
import session from 'models/session.js'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.cleanDatabase()
  await orchestrator.runPendingMigrations()
})

describe('POST /api/v1/sessions', () => {
  describe('Anonymous user', () => {
    test('With incorrect `email` and correct `password`', async () => {
      await orchestrator.createUser({
        password: 'senha-correta',
      })

      const response = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'emailincorreto@email.com',
          password: 'senha-correta',
        }),
      })

      expect(response.status).toBe(401)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        name: 'UnauthorizedError',
        status_code: 401,
        message: 'Dados de autenticação incorretos.',
        action: 'Verifique se os dados enviados estão corretos.',
      })
    })

    test('With incorrect `password` and correct `email`', async () => {
      await orchestrator.createUser({
        email: 'emailcorreto@email.com',
      })

      const response = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'emailcorreto@email.com',
          password: 'senha-incorreta',
        }),
      })

      expect(response.status).toBe(401)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        name: 'UnauthorizedError',
        status_code: 401,
        message: 'Dados de autenticação incorretos.',
        action: 'Verifique se os dados enviados estão corretos.',
      })
    })

    test('With incorrect `password` and incorrect `email`', async () => {
      await orchestrator.createUser({
        email: 'email.incorreto@email.com',
        password: 'senha-incorreta',
      })

      const response = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'email.incorreto1@email.com',
          password: 'senha-incorreta1',
        }),
      })

      expect(response.status).toBe(401)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        name: 'UnauthorizedError',
        status_code: 401,
        message: 'Dados de autenticação incorretos.',
        action: 'Verifique se os dados enviados estão corretos.',
      })
    })

    test('With correct `password` and correct `email`', async () => {
      const createdUser = await orchestrator.createUser({
        email: 'email.correto@email.com',
        password: 'senha-correta',
      })

      await orchestrator.activateUserById(createdUser.id)

      const response = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'email.correto@email.com',
          password: 'senha-correta',
        }),
      })

      expect(response.status).toBe(201)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: createdUser.id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      })

      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN()

      const createdAt = new Date(responseBody.created_at)
      const expiresAt = new Date(responseBody.expires_at)

      createdAt.setMilliseconds(0)
      expiresAt.setMilliseconds(0)
      createdAt.setSeconds(0)
      expiresAt.setSeconds(0)

      expect(expiresAt - createdAt).toBe(sessions.EXPIRATION_IN_MILLISECONDS)

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      })

      expect(parsedSetCookie.session_id).toEqual({
        name: 'session_id',
        value: responseBody.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: '/',
        httpOnly: true,
      })
    })
  })
})
