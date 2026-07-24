import webserver from 'infra/webserver'
import activation from 'models/activation'
import user from 'models/user'
import orchestrator from 'tests/orchestrator'
import { beforeAll, describe, expect, test } from 'vitest'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.cleanDatabase()
  await orchestrator.runPendingMigrations()
  await orchestrator.deleteAllEmails()
})

describe('Use case: Registration flow (all successful)', () => {
  let createUserResponseBody
  let activationToken

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

    createUserResponseBody = await createUserResponse.json()

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

  test('Receive activation email', async () => {
    const lastEmail = await orchestrator.getLastEmail()

    const token = orchestrator.getTokenFromEmail(lastEmail.text)

    activationToken = await activation.findOneByValidToken(token)

    expect(lastEmail.sender).toBe('<test@test.com>')
    expect(lastEmail.recipients[0]).toBe('<registration.flow@email.com>')
    expect(lastEmail.subject).toBe('Ative seu cadastro no Finmarket.')
    expect(lastEmail.text).toContain('RegistrationFlow')
    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${token}`
    )

    expect(activationToken.id).toBe(token)
    expect(activationToken.user_id).toBe(createUserResponseBody.id)
    expect(activationToken.used_at).toBe(null)
  })

  test('Active account', async () => {
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activationToken.id}`,
      {
        method: 'PATCH',
      }
    )

    expect(activationResponse.status).toBe(200)

    const activationResponseBody = await activationResponse.json()

    expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN()

    const confirmedUser = await user.findOneById(activationResponseBody.user_id)

    expect(confirmedUser.features).toEqual(['create:session'])
  })

  test('Login', async () => {})

  test('Get user information', async () => {})
})
