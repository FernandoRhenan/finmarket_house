import { createRouter } from 'next-connect'
import controller from 'infra/controller'
import activation from 'models/activation'

const router = createRouter()

router.patch(patchHandler)

export default router.handler(controller.errorHandlers)

async function patchHandler(request, response) {
  const { token } = request.query

  const activatedToken = await activation.updateTokenToUsed(token)
  await activation.activateUserById(activatedToken.user_id)

  return response.status(200).json(activatedToken)
}
