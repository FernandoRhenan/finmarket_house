import email from 'infra/email'
import { beforeAll, describe, expect, test } from 'vitest'
import orchestrator from 'tests/orchestrator'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
})

describe('infra/email.js', () => {
  test('send()', async () => {
    await orchestrator.deleteAllEmails()

    await email.send({
      from: 'Tester <teste1@teste.com>',
      to: 'teste2@teste.com',
      subject: 'Assunto de teste',
      text: 'Texto de teste',
    })

    await email.send({
      from: 'Tester <teste1@teste.com>',
      to: 'teste2@teste.com',
      subject: 'Ultimo email enviado',
      text: 'Texto do ultimo email enviado',
    })

    const lastEmail = await orchestrator.getLastEmail()

    expect(lastEmail.sender).toBe('<teste1@teste.com>')
    expect(lastEmail.recipients[0]).toBe('<teste2@teste.com>')
    expect(lastEmail.subject).toBe('Ultimo email enviado')
    expect(lastEmail.text).toBe('Texto do ultimo email enviado\n')
  })
})
