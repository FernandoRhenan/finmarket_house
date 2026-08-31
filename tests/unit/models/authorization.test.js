import { InternalServerError } from 'infra/error'
import authorization from 'models/authorization'
import { describe, expect, test } from 'vitest'

describe('models/authorization.js', () => {
  describe('.can()', () => {
    test('without `user`', () => {
      expect(() => {
        authorization.can()
      }).toThrow(InternalServerError)
    })

    test('without `user.features`', () => {
      const user = {
        username: 'UserWithoutFeatures',
      }

      expect(() => {
        authorization.can(user)
      }).toThrow(InternalServerError)
    })

    test('with unknown `feature`', () => {
      const user = {
        features: [],
      }

      expect(() => {
        authorization.can(user, 'unknown:feature')
      }).toThrow(InternalServerError)
    })

    test('with valid `user` and known `feature`', () => {
      const user = {
        username: 'ValidUser',
        features: ['create:user'],
      }

      expect(authorization.can(user, user.features[0])).toBeTruthy()
    })
  })

  describe('.filterOutput()', () => {
    test('without `user`', () => {
      expect(() => {
        authorization.filterOutput()
      }).toThrow(InternalServerError)
    })

    test('without `user.features`', () => {
      const user = {
        username: 'UserWithoutFeatures',
      }

      expect(() => {
        authorization.filterOutput(user)
      }).toThrow(InternalServerError)
    })

    test('with unknown `feature`', () => {
      const user = {
        features: [],
      }

      expect(() => {
        authorization.filterOutput(user, 'unknown:feature')
      }).toThrow(InternalServerError)
    })

    test('with valid `user`, known `feature` and `resource`', () => {
      const user = {
        username: 'ValidUser',
        features: ['read:user'],
      }

      const resource = {
        id: 1,
        username: 'resource',
        email: 'resource@resource.com',
        password: 'resource',
        features: ['read:user'],
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }

      const result = authorization.filterOutput(user, 'read:user', resource)

      expect(result).toEqual({
        id: 1,
        username: 'resource',
        features: ['read:user'],
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      })
    })

    test('with valid `user`, known `feature`, but no `resource`', () => {
      const user = {
        user: 'ValidUser',
        features: ['read:user'],
      }

      expect(() => {
        authorization.filterOutput(user, user.features[0])
      }).toThrow(InternalServerError)
    })
  })
})
