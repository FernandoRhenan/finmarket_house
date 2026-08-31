import { createRouter } from 'next-connect'
import controller from 'infra/controller'
import activation from 'models/activation'
import authorization from 'models/authorization'

const router = createRouter()

router.use(controller.injectAnonymousOrUser)
router.patch(controller.canRequest('read:activation_token'), patchHandler)

export default router.handler(controller.errorHandlers)

async function patchHandler(request, response) {
  const userTryingToActivate = request.context.user
  const { token } = request.query

  const validActivationToken = await activation.findOneByValidToken(token)
  await activation.activateUserById(validActivationToken.user_id)
  const activatedToken = await activation.updateTokenToUsed(token)

  const secureOutputValues = authorization.filterOutput(
    userTryingToActivate,
    'read:activation_token',
    activatedToken
  )

  return response.status(200).json(secureOutputValues)
}
