const tableName = process.env.DB_TABLE_NAME;

// Create a DocumentClient that represents the query to add an item
const AWS = require("aws-sdk");
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();

// https://hackernoon.com/websockets-api-gateway-9d4aca493d39
// https://medium.com/hackernoon/websockets-api-gateway-9d4aca493d39
async function send(data, event, callback) {
  const apig = new AWS.ApiGatewayManagementApi({
    endpoint: "q7uxempud1.execute-api.us-west-1.amazonaws.com/Prod/",
  });

  let sdata = JSON.stringify(data);

  await apig.postToConnection({
        ConnectionId: event.requestContext.connectionId,
        Data: sdata
      }).promise();
  let response = {
    "statusCode": 200,
    "headers": {},
    "body": "",
    "isBase64Encoded": false
  };
  callback(null, response);
}

exports.getAllItemsHandler = async (event) => {
  if (event.httpMethod !== 'GET') {
    throw new Error(`getAllItems only accept GET method, you tried: ${event.httpMethod}`);
  }
  // All log statements are written to CloudWatch
  console.info('received:', event);

  let params = {
    TableName : tableName
  };
  const data = await docClient.scan(params).promise();
  const items = data.Items;

  const response = {
    statusCode: 200,
    body: JSON.stringify(items)
  };

  // All log statements are written to CloudWatch
  console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
  return response;
}

exports.getByIdHandler = async (event) => {
  if (event.httpMethod !== 'GET') {
    throw new Error(`getMethod only accept GET method, you tried: ${event.httpMethod}`);
  }
  // All log statements are written to CloudWatch
  console.info('received:', event);

  const id = parseInt(event.pathParameters.id);

  let params = {
    TableName : tableName,
    Key: { id: id },
  };
  const data = await docClient.get(params).promise();
  const item = data.Item;

  const response = {
    statusCode: 200,
    body: JSON.stringify(item)
  };

  // All log statements are written to CloudWatch
  console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
  return response;
}

exports.putItemHandler = async (event) => {
  if (event.httpMethod !== 'POST') {
    throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
  }
  // All log statements are written to CloudWatch
  console.info('received:', event);

  // Get id and name from the body of the request
  const body = JSON.parse(event.body)
  const id = body.id;
  const name = body.name;

  let params = {
    TableName : tableName,
    Item: { id : id, name: name }
  };

  const result = await docClient.put(params).promise();

  const response = {
    statusCode: 200,
    body: JSON.stringify(body)
  };

  // All log statements are written to CloudWatch
  console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
  return response;
}

exports.connectHandler = async (event, context, callback) => {
  console.log("Socket connection successful");
  callback(null, {});
}

exports.defaultHandler = async (event, context, callback) => {
  console.log("Socket default successful");
  await send({"newkey": "newval"}, event, callback);
}