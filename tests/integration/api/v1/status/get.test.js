import orchestrator from 'tests/orchestrator'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
})

describe('GET /api/v1/status', () => {
  describe('Anonymous user', () => {
    test('Getting the system status', async () => {
      const response = await fetch('http://localhost:3000/api/v1/status')
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
