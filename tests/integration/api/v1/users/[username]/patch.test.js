import { version as uuidVersion } from 'uuid'
import orchestrator from 'tests/orchestrator.js'
import { beforeAll, describe, expect, test } from 'vitest'
import user from 'models/user'
import password from 'models/password'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.cleanDatabase()
  await orchestrator.runPendingMigrations()
})

describe('PATCH /api/v1/users/[username]', () => {
  describe('Anonymous user', () => {
    test('With nonexistent "username"', async () => {
      const response = await fetch(
        'http://localhost:3000/api/v1/users/usuarioInexistente',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      expect(response.status).toBe(404)

      const responseBody = await response.json()
      expect(responseBody).toEqual({
        name: 'NotFoundError',
        message: 'O username informado não foi encontrado no sistema.',
        action: 'Verifique se o username está digitado corretamente.',
        status_code: 404,
      })
    })

    test('With duplicated "username"', async () => {
      await orchestrator.createUser({ username: 'user1' })
      await orchestrator.createUser({ username: 'user2' })

      const response = await fetch('http://localhost:3000/api/v1/users/user2', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'user1',
        }),
      })

      expect(response.status).toBe(400)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        name: 'ValidationError',
        message: 'O username informado já está sendo utilizado.',
        action: 'Utilize outro username para realizar esta operação.',
        status_code: 400,
      })
    })

    test('With duplicated "email"', async () => {
      const userWantTheNewEmail = await orchestrator.createUser({
        email: 'duplicated1@email.com',
      })
      await orchestrator.createUser({ email: 'duplicated2@email.com' })

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userWantTheNewEmail.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'duplicated2@email.com',
          }),
        }
      )

      expect(response.status).toBe(400)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        name: 'ValidationError',
        message: 'O email informado já está sendo utilizado.',
        action: 'Utilize outro email para realizar esta operação.',
        status_code: 400,
      })
    })

    test('With unique "username"', async () => {
      const user = await orchestrator.createUser({
        username: 'uniqueUser1',
        email: 'uniqueuser1@email.com',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'uniqueUser2',
          }),
        }
      )

      expect(response.status).toBe(200)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: 'uniqueUser2',
        email: user.email,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      })

      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()
      expect(responseBody.updated_at > responseBody.created_at).toBeTruthy()
    })

    test('With unique "email"', async () => {
      const user = await orchestrator.createUser({
        username: 'uniqueEmailUser1',
        email: 'uniqueemailuser1@email.com',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'uniqueemailuser2@email.com',
          }),
        }
      )

      expect(response.status).toBe(200)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: user.username,
        email: 'uniqueemailuser2@email.com',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      })

      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()
      expect(responseBody.updated_at > responseBody.created_at).toBeTruthy()
    })

    test('With new "password"', async () => {
      const userData = await orchestrator.createUser({
        password: 'currentPassword',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userData.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: 'newPassword',
          }),
        }
      )

      expect(response.status).toBe(200)

      const responseBody = await response.json()
      const userInDatabase = await user.findOneByUsername(userData.username)

      const oldPasswordMatch = await password.compare(
        'currentPassword',
        userInDatabase.password
      )

      const correctPasswordMatch = await password.compare(
        'newPassword',
        userInDatabase.password
      )

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: userData.username,
        email: userData.email,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      })

      expect(userData.username).toBe(responseBody.username)
      expect(userData.email).toBe(responseBody.email)
      expect(correctPasswordMatch).toBeTruthy()
      expect(oldPasswordMatch).toBeFalsy()
      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()
      expect(responseBody.updated_at > responseBody.created_at).toBeTruthy()
    })
  })
})
