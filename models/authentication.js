import user from 'models/user.js'
import password from 'models/password.js'
import { NotFoundError, UnauthorizedError } from 'infra/error.js'

async function getAuthenticatedUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail)
    await comparePassword(providedPassword, storedUser.password)
    return storedUser
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: 'Dados de autenticação incorretos.',
        action: 'Verifique se os dados enviados estão corretos.',
      })
    }
    throw error
  }

  async function findUserByEmail(email) {
    try {
      const storedUser = await user.findOneByEmail(email)
      return storedUser
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: 'Email incorreto.',
          action: 'Verifique se os dados enviados estão corretos.',
        })
      }
      throw error
    }
  }

  async function comparePassword(providedPassword, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      storedPassword
    )

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: 'Senha incorreta.',
        action: 'Verifique se os dados enviados estão corretos.',
      })
    }
  }
}

const authentication = {
  getAuthenticatedUser,
}

export default authentication
