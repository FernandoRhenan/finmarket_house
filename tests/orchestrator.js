import retry from 'async-retry'
import database from 'infra/database'
import migrator from 'models/migrator'
import user from 'models/user'
import session from 'models/session'
import { faker } from '@faker-js/faker'

const emailHttppUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`

async function waitForAllServices() {
  await waitForWebServer()
  await waitForEmailServer()

  async function waitForEmailServer() {
    return await retry(fetchEmailStatus, {
      retries: 100,
      maxTimeout: 1000,
    })

    async function fetchEmailStatus(bail, tries) {
      // console.log('Count of email status tries: ' + tries)

      const response = await fetch(emailHttppUrl)

      if (response.status !== 200) {
        throw Error()
      }
    }
  }

  async function waitForWebServer() {
    return await retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    })

    async function fetchStatusPage(bail, tries) {
      // console.log('Count of status page tries: ' + tries)

      const response = await fetch('http://localhost:3000/api/v1/status')

      if (response.status !== 200) {
        throw Error()
      }
    }
  }
}

async function cleanDatabase() {
  await database.query('drop schema public cascade; create schema public;')
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations()
}

async function createUser(userObject) {
  return await user.create({
    username:
      userObject?.username || faker.internet.username().replace(/[_.-]/g, ''),
    email: userObject?.email || faker.internet.email(),
    password: userObject?.password || 'validpassword',
  })
}

async function createSession(userId) {
  return await session.create(userId)
}

async function deleteAllEmails() {
  await fetch(`${emailHttppUrl}/messages`, {
    method: 'DELETE',
  })
}

async function getLastEmail() {
  const emailListResponse = await fetch(`${emailHttppUrl}/messages`)
  const emailListBody = await emailListResponse.json()
  const lastEmailItem = emailListBody.pop()

  if (!lastEmailItem) return null

  const emailTextResponse = await fetch(
    `${emailHttppUrl}/messages/${lastEmailItem.id}.plain`
  )
  const emailTextBody = await emailTextResponse.text()

  lastEmailItem.text = emailTextBody
  return lastEmailItem
}

const orchestrator = {
  waitForAllServices,
  cleanDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
}

export default orchestrator
