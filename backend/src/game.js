const tableName = process.env.DB_TABLE_NAME;

// Create a DocumentClient that represents the query to add an item
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();

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
  callback(null, "CUSTOM MESSAGE")
}

exports.defaultHandler = async (event) => {
  console.log("Socket default successful");
  return {
    statusCode: 200,
    body: "DEFAULT MESSAGE"
  };
}