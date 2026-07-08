import orchestrator from 'tests/orchestrator'
import { beforeAll, describe, expect, test } from 'vitest'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.cleanDatabase()
  await orchestrator.runPendingMigrations()
  await orchestrator.deleteAllEmails()
})

describe('Use case: Registration flow (all successful)', () => {
  test('Create user account', async () => {
    const createUserResponse = await fetch(
      'http://localhost:3000/api/v1/users',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'RegistrationFlow',
          email: 'registration.flow@email.com',
          password: 'registrationFlowPassword',
        }),
      }
    )

    expect(createUserResponse.status).toBe(201)

    const createUserResponseBody = await createUserResponse.json()

    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: 'RegistrationFlow',
      email: 'registration.flow@email.com',
      password: createUserResponseBody.password,
      features: ['read:activation_token'],
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    })
  })

  test('Receive activation email', async () => {})

  test('Active account', async () => {})

  test('Login', async () => {})

  test('Get user information', async () => {})
})
