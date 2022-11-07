import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createTodo } from '../../dataLayer/todosAcess'
import { buildTodo } from '../../businessLogic/todos'


export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    console.log(newTodo)
    // TODO: Implement creating a new TODO item
    const todo = buildTodo(newTodo, event)

    const todoCreated = await createTodo(todo);

    return {
      statusCode: 201,
      body: JSON.stringify({
        item: todoCreated
      })
    }
  })

handler.use(
  cors({
    credentials: true 
  })
)
