import { createRouter } from 'next-connect'
import controller from 'infra/controller'
import activation from 'models/activation'
import user from 'models/user'

const router = createRouter()

router.patch(patchHandler)

export default router.handler(controller.errorHandlers)

async function patchHandler(request, response) {
  const { token } = request.query

  const activatedToken = await activation.updateTokenToUsed(token)
  await user.updateFeaturesToCreateSession(activatedToken.user_id)

  return response.status(200).json(activatedToken)
}
