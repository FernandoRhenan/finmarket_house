import database from 'infra/database'
import email from 'infra/email'
import { NotFoundError } from 'infra/error'
import webserver from 'infra/webserver'
import user from 'models/user'

const EXPIRATION_IN_MILISECONDS = 60 * 15 * 1000

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: process.env.EMAIL_SENDER,
    to: user.email,
    subject: 'Ative seu cadastro no Finmarket.',
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no Finmarket.

${webserver.origin}/cadastro/ativar/${activationToken}

Atenciosamente,
Equipe Finmarket
    `,
  })
}

async function create(userId) {
  const expires_at = new Date(Date.now() + EXPIRATION_IN_MILISECONDS)

  const newToken = await runInsertQuery(userId, expires_at)

  return newToken

  async function runInsertQuery(userId, expires_at) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
        ;
      `,
      values: [userId, expires_at],
    })

    return results.rows[0]
  }
}

async function findOneByValidToken(token) {
  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        id = $1
        AND
        used_at IS NULL
        AND
        expires_at > NOW()
      LIMIT
        1
    ;
    `,
    values: [token],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: 'O token de ativação não foi encontrado ou expirou.',
      action: 'Faça um novo cadastro.',
    })
  }

  return results.rows[0]
}

async function findUsedToken(token) {
  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        id = $1
        AND
        used_at IS NOT NULL
      LIMIT
        1
    ;
    `,
    values: [token],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: 'O token de ativação não foi encontrado ou expirou.',
      action: 'Faça um novo cadastro.',
    })
  }

  return results.rows[0]
}

async function updateTokenToUsed(token) {
  const results = await database.query({
    text: `
      UPDATE
        user_activation_tokens
      SET
        used_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
        AND
        expires_at > NOW()
      RETURNING
        *
    ;
    `,
    values: [token],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: 'O token de ativação não foi confirmado.',
      action: 'Faça um novo cadastro.',
    })
  }

  return results.rows[0]
}

async function activateUserById(userId) {
  const activatedUser = await user.setFeatures(userId, [
    'create:session',
    'read:session',
  ])
  return activatedUser
}

const activation = {
  sendEmailToUser,
  create,
  findOneByValidToken,
  findUsedToken,
  updateTokenToUsed,
  activateUserById,
}

export default activation
