import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { getUserId } from '../utils'
import { getUploadUrl, updateTodoUrl } from '../../helpers/attachmentUtils'
import { createAttachmentItemPresignedUrl } from '../../helpers/todos'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const uploadUrl = getUploadUrl(todoId)
    const userId = getUserId(event);

    await updateTodoUrl( userId, todoId)

    const url = await createAttachmentItemPresignedUrl(todoId,userId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        uploadUrl,
        url
      }),
    };
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
