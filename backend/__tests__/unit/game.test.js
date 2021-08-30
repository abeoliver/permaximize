const lambda = require('../../src/game.js');
// Import dynamodb from aws-sdk
const dynamodb = require('aws-sdk/clients/dynamodb');

// This includes all tests for getAllItemsHandler()
describe('Test getAllItemsHandler', () => {
  let scanSpy;

  // Test one-time setup and teardown, see more in https://jestjs.io/docs/en/setup-teardown
  beforeAll(() => {
    // Mock dynamodb get and put methods
    // https://jestjs.io/docs/en/jest-object.html#jestspyonobject-methodname
    scanSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'scan');
  });

  // Clean up mocks
  afterAll(() => {
    scanSpy.mockRestore();
  });

  it('should return ids', async () => {
    const items = [{ id: 'id1' }, { id: 'id2' }];

    // Return the specified value whenever the spied scan function is called
    scanSpy.mockReturnValue({
      promise: () => Promise.resolve({ Items: items })
    });

    const event = {
      httpMethod: 'GET'
    }

    // Invoke helloFromLambdaHandler()
    const result = await lambda.getAllItemsHandler(event);

    const expectedResult = {
      statusCode: 200,
      body: JSON.stringify(items)
    };

    // Compare the result with the expected result
    expect(result).toEqual(expectedResult);
  });
});

describe('Test getByIdHandler', () => {
  let getSpy;

  // Test one-time setup and teardown, see more in https://jestjs.io/docs/en/setup-teardown
  beforeAll(() => {
    // Mock dynamodb get and put methods
    // https://jestjs.io/docs/en/jest-object.html#jestspyonobject-methodname
    getSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'get');
  });

  // Clean up mocks
  afterAll(() => {
    getSpy.mockRestore();
  });

  // This test invokes getByIdHandler() and compare the result
  it('should get item by id', async () => {
    const item = { id: 'id1' };

    // Return the specified value whenever the spied get function is called
    getSpy.mockReturnValue({
      promise: () => Promise.resolve({ Item: item })
    });

    const event = {
      httpMethod: 'GET',
      pathParameters: {
        id: 'id1'
      }
    }

    // Invoke getByIdHandler()
    const result = await lambda.getByIdHandler(event);

    const expectedResult = {
      statusCode: 200,
      body: JSON.stringify(item)
    };

    // Compare the result with the expected result
    expect(result).toEqual(expectedResult);
  });
});

describe('Test putItemHandler', function () {
  let putSpy;

  // Test one-time setup and teardown, see more in https://jestjs.io/docs/en/setup-teardown
  beforeAll(() => {
    // Mock dynamodb get and put methods
    // https://jestjs.io/docs/en/jest-object.html#jestspyonobject-methodname
    putSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'put');
  });

  // Clean up mocks
  afterAll(() => {
    putSpy.mockRestore();
  });

  // This test invokes putItemHandler() and compare the result
  it('should add id to the table', async () => {
    const returnedItem = { id: 'id1', name: 'name1' };

    // Return the specified value whenever the spied put function is called
    putSpy.mockReturnValue({
      promise: () => Promise.resolve(returnedItem)
    });

    const event = {
      httpMethod: 'POST',
      body: '{"id": "id1","name": "name1"}'
    };

    // Invoke putItemHandler()
    const result = await lambda.putItemHandler(event);
    const expectedResult = {
      statusCode: 200,
      body: JSON.stringify(returnedItem)
    };

    // Compare the result with the expected result
    expect(result).toEqual(expectedResult);
  });
});
