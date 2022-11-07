import { TodoUpdate } from '../models/TodoUpdate';
import { TodoItem } from '../models/TodoItem';
import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
const AWSXRAY = require('aws-xray-sdk');
import { Types } from 'aws-sdk/clients/s3';


const XAWS =  AWSXRAY.captureAWS(AWS);
const todosTable = process.env.TODOS_TABLE
const docClient: DocumentClient = createDynamoDBClient()
const s3 = new XAWS.S3({ signatureVersion: 'v4' })
const s3Client: Types = new AWS.S3({ signatureVersion: 'v4' })
const bucketName = process.env.ATTACHMENT_S3_BUCKET

const logger = createLogger('Todos');


// TODO: Implement the dataLayer logic

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
    console.log('Getting all todos')

    const result = await docClient.query({
      TableName: todosTable,
      KeyConditionExpression: '#userId = :userId',
      ExpressionAttributeNames: {
        "#userId": "userId"
    },
    ExpressionAttributeValues: {
        ":userId": userId
    }
    }).promise()

    const items = result.Items
    return items as TodoItem[]
  }

export async function createTodo (todo: TodoItem): Promise<TodoItem> {
    await docClient.put({
      TableName: todosTable,
      Item: todo
    }).promise()
 
    return todo
  }

export async function updateTodoItem(todoUpdate: TodoUpdate, todoId: string, userId: string): Promise<TodoUpdate> {
  console.log("Update Todo Function");

  const result = await docClient.update({
      TableName: todosTable,
      Key: {
          "userId": userId,
          "todoId": todoId
      },
      UpdateExpression: "set #a = :a, #b = :b, #c = :c",
      ExpressionAttributeNames: {
          "#a": "name",
          "#b": "dueDate",
          "#c": "done"
      },
      ExpressionAttributeValues: {
          ":a": todoUpdate['name'],
          ":b": todoUpdate['dueDate'],
          ":c": todoUpdate['done']
      },
      ReturnValues: "ALL_NEW"
  }).promise();
  
  const attributes = result.Attributes;
  return attributes as TodoUpdate;
}


export async function deleteTodoItem(todoId: string, userId: string): Promise<string> {
  console.log("Deleting Todo Function");

  await docClient.delete({
    TableName: todosTable,
    Key: {
        "userId": userId,
        "todoId": todoId
    }
  }).promise();
  return "" as string;
}

export async function createAttachmentPresignedUrl(todoId: string): Promise<string> {
  console.log("URL Generator Function");

  return s3Client.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: todoId,
      Expires: 1000,
  });
  // return url as string;
}

export async function updateTodoItemUrl(todoId: string, userId: string, attachmentUrl: string): Promise<TodoItem> {
  await docClient.update({
      TableName: todosTable,
      Key: { 
          todoId: todoId, 
          userId: userId },
      ExpressionAttributeNames: {"#A": "attachmentUrl"},
      UpdateExpression: "set #A = :attachmentUrl",
      ExpressionAttributeValues: {
          ":attachmentUrl": attachmentUrl,
      },
      ReturnValues: "UPDATED_NEW"
  }).promise()

  return {todoId,userId,attachmentUrl} as TodoItem
}

export async function setTodoAttachmentUrl(todoId: string, userId: string): Promise<string> {
  logger.info('Generating upload Url')
  const url = await s3.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: todoId,
      Expires: 10000,
  });
  await docClient.update({
    TableName: todosTable,
    Key: { userId, todoId},
    UpdateExpression: "set attachmentUrl=:URL",
    ExpressionAttributeValues: {
      ":URL": url.split("?")[0]
    },
    ReturnValues: "UPDATED_NEW"
    })
    .promise();
    return url;
  }


  function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
      console.log('Creating a local DynamoDB instance')
      return new XAWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      })
    }

    return new XAWS.DynamoDB.DocumentClient()
  }