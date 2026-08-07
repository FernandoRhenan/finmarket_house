import { createRouter } from 'next-connect'
import controller from 'infra/controller'
import activation from 'models/activation'

const router = createRouter()

router.use(controller.injectAnonymousOrUser)
router.patch(controller.canRequest('read:activation_token'), patchHandler)

export default router.handler(controller.errorHandlers)

async function patchHandler(request, response) {
  const { token } = request.query

  const validActivationToken = await activation.findOneByValidToken(token)
  await activation.activateUserById(validActivationToken.user_id)
  const activatedToken = await activation.updateTokenToUsed(token)

  return response.status(200).json(activatedToken)
}
