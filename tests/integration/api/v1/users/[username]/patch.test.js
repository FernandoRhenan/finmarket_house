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
    test('With unique "email"', async () => {
      const user = await orchestrator.createUser({
        username: 'uniqueAnonymousEmailUser1',
        email: 'uniqueAnonymousEmailUser1@email.com',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'uniqueAnonymousEmailUser2@email.com',
          }),
        }
      )

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
    test('With nonexistent "username"', async () => {
      const createdUser = await orchestrator.createUser()
      await orchestrator.activateUserById(createdUser.id)
      const session = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        'http://localhost:3000/api/v1/users/UsuarioInexistente',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session_id=${session.token}`,
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

      const createdUser = await orchestrator.createUser({ username: 'user2' })
      await orchestrator.activateUserById(createdUser.id)
      const session = await orchestrator.createSession(createdUser.id)

      const response = await fetch('http://localhost:3000/api/v1/users/user2', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session_id=${session.token}`,
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
      const firstUser = await orchestrator.createUser({
        email: 'duplicated1@email.com',
      })
      await orchestrator.activateUserById(firstUser.id)
      const session = await orchestrator.createSession(firstUser.id)

      const secondUser = await orchestrator.createUser({
        email: 'duplicated2@email.com',
      })

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${firstUser.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            email: secondUser.email,
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

      await orchestrator.activateUserById(user.id)
      const session = await orchestrator.createSession(user.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            username: 'uniqueUser2',
          }),
        }
      )

      expect(response.status).toBe(200)

      const responseBody = await response.json()

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        username: 'uniqueUser2',
        features: ['create:session', 'read:session', 'update:user'],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      })

      expect(responseBody.username).not.toBe(user.username)

      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()
      expect(responseBody.updated_at > responseBody.created_at).toBeTruthy()
    })

    test('With "userB" targeting "userA"', async () => {
      await orchestrator.createUser({ username: 'userA' })

      const userB = await orchestrator.createUser({ username: 'userB' })
      await orchestrator.activateUserById(userB.id)
      const userBSession = await orchestrator.createSession(userB.id)

      const response = await fetch('http://localhost:3000/api/v1/users/userA', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session_id=${userBSession.token}`,
        },
        body: JSON.stringify({
          username: 'userC',
        }),
      })

      expect(response.status).toBe(403)

      const responseBody = await response.json()

      expect(responseBody).toEqual({
        name: 'ForbiddenError',
        message: 'Você não possui permissão para atualizar outro usuário.',
        action:
          'Verifique se você possui a feature necessária para atualizar outro usuário.',
        status_code: 403,
      })
    })

    test('With unique "email"', async () => {
      const user = await orchestrator.createUser({
        username: 'uniqueEmailUser1',
        email: 'uniqueemailuser1@email.com',
      })

      await orchestrator.activateUserById(user.id)
      const session = await orchestrator.createSession(user.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            email: 'uniqueemailuser2@email.com',
          }),
        }
      )

      expect(response.status).toBe(200)

      const responseBody = await response.json()

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        username: 'uniqueEmailUser1',
        features: ['create:session', 'read:session', 'update:user'],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      })

      expect(responseBody.email).not.toBe(user.email)

      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()
      expect(responseBody.updated_at > responseBody.created_at).toBeTruthy()
    })

    test('With new "password"', async () => {
      const createdUser = await orchestrator.createUser({
        password: 'currentPassword',
      })

      await orchestrator.activateUserById(createdUser.id)
      const session = await orchestrator.createSession(createdUser.id)

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            password: 'newPassword',
          }),
        }
      )

      expect(response.status).toBe(200)

      const responseBody = await response.json()
      const userInDatabase = await user.findOneByUsername(createdUser.username)

      const oldPasswordMatch = await password.compare(
        'currentPassword',
        userInDatabase.password
      )

      const correctPasswordMatch = await password.compare(
        'newPassword',
        userInDatabase.password
      )

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        username: createdUser.username,
        features: ['create:session', 'read:session', 'update:user'],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      })

      expect(createdUser.username).toBe(responseBody.username)
      expect(createdUser.email).toBe(userInDatabase.email)
      expect(correctPasswordMatch).toBeTruthy()
      expect(oldPasswordMatch).toBeFalsy()
      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()
      expect(responseBody.updated_at > responseBody.created_at).toBeTruthy()
    })
  })

  describe('Privileged user', () => {
    test('With `update:user:others` targeting `defaultUser`', async () => {
      const privilegedUser = await orchestrator.createUser()
      const activatedPrivilegedUser = await orchestrator.activateUserById(
        privilegedUser.id
      )

      await orchestrator.addFeaturesToUser(privilegedUser.id, [
        'update:user:others',
      ])
      const privilegedUserSession = await orchestrator.createSession(
        activatedPrivilegedUser.id
      )

      const defaultUser = await orchestrator.createUser()

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session_id=${privilegedUserSession.token}`,
          },
          body: JSON.stringify({
            username: 'randomUser',
          }),
        }
      )

      expect(response.status).toBe(200)

      const responseBody = await response.json()

      expect(responseBody).toStrictEqual({
        id: defaultUser.id,
        username: 'randomUser',
        features: defaultUser.features,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      })

      expect(responseBody.username).not.toBe(user.username)

      expect(uuidVersion(responseBody.id)).toBe(4)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN()
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN()
      expect(responseBody.updated_at > responseBody.created_at).toBeTruthy()
    })
  })
})
