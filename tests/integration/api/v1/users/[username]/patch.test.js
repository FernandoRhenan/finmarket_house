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
      const user1Response = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'user1',
          email: 'user1@email.com',
          password: 'senha111',
        }),
      })

      expect(user1Response.status).toBe(201)

      const user2Response = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'user2',
          email: 'user2@email.com',
          password: 'senha111',
        }),
      })

      expect(user2Response.status).toBe(201)

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
      const user1Response = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'user3',
          email: 'email1@email.com',
          password: 'senha111',
        }),
      })

      expect(user1Response.status).toBe(201)

      const user2Response = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'user4',
          email: 'email2@email.com',
          password: 'senha111',
        }),
      })

      expect(user2Response.status).toBe(201)

      const response = await fetch('http://localhost:3000/api/v1/users/user4', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'email1@email.com',
        }),
      })

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
      const user1Response = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'uniqueUser1',
          email: 'uniqueuser1@email.com',
          password: 'senha111',
        }),
      })

      expect(user1Response.status).toBe(201)

      const response = await fetch(
        'http://localhost:3000/api/v1/users/uniqueUser1',
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
        email: 'uniqueuser1@email.com',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      })

      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()
      expect(responseBody.updated_at > responseBody.created_at).toBeTruthy()
    })

    test('With unique "email"', async () => {
      const user1Response = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'uniqueEmail10',
          email: 'uniqueemail10@email.com',
          password: 'senha111',
        }),
      })

      expect(user1Response.status).toBe(201)

      const response = await fetch(
        'http://localhost:3000/api/v1/users/uniqueEmail10',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'uniqueemail11@email.com',
          }),
        }
      )

      expect(response.status).toBe(200)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: 'uniqueEmail10',
        email: 'uniqueemail11@email.com',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      })

      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()
      expect(responseBody.updated_at > responseBody.created_at).toBeTruthy()
    })

    test('With new "password"', async () => {
      const user1Response = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'newPassword1',
          email: 'newpassword1@email.com',
          password: 'newPassword1',
        }),
      })

      expect(user1Response.status).toBe(201)

      const response = await fetch(
        'http://localhost:3000/api/v1/users/newPassword1',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: 'newPassword2',
          }),
        }
      )

      expect(response.status).toBe(200)

      const responseBody = await response.json()

      const userInDatabase = await user.findOneByUsername(responseBody.username)

      const correctPasswordMatch = await password.compare(
        'newPassword2',
        userInDatabase.password
      )

      const oldPasswordMatch = await password.compare(
        'newPassword1',
        userInDatabase.password
      )

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: 'newPassword1',
        email: 'newpassword1@email.com',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      })

      expect(correctPasswordMatch).toBeTruthy()
      expect(oldPasswordMatch).toBeFalsy()
      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()
      expect(responseBody.updated_at > responseBody.created_at).toBeTruthy()
    })
  })
})
