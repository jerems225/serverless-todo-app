import { TodoUpdate } from '../models/TodoUpdate';
import { UpdateTodoRequest } from '../../../client/src/types/UpdateTodoRequest';
import { TodoItem } from '../models/TodoItem';
import { deleteTodoItem, getAllTodos, setTodoAttachmentUrl, updateTodoItem } from '../dataLayer/todosAcess'
// import { AttachmentUtils } from './attachmentUtils';
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
// import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
// import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import { getUserId } from '../lambda/utils'
// import * as createError from 'http-errors'

// TODO: Implement businessLogic
export function getTodos(userId: string): Promise<TodoItem[]> {
    return getAllTodos(userId)
  }

export function buildTodo(todoResquest : CreateTodoRequest, event): TodoItem
{
    const todo = {
        todoId: uuid.v4(),
        createdAt: new Date().toISOString(),
        userId: getUserId(event),
        done: false,
        attachmentUrl: "",
        ...todoResquest
    }

    return todo
}

export function updateTodo(updateTodoRequest: UpdateTodoRequest, todoId: string, userId: string): Promise<TodoUpdate> {
    return updateTodoItem(updateTodoRequest, todoId, userId);
  }

export async function createAttachmentItemPresignedUrl(todoId: string, userId: string): Promise<string> {
  const url = await setTodoAttachmentUrl(todoId, userId);
  return url
}

export function deleteTodo(todoId: string, userId: string): Promise<string> {
    return deleteTodoItem(todoId, userId);
  }
