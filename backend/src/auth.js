exports.authorizer = function(event, context, callback) {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Retrieve request parameters from the Lambda function input:
  let headers = event.headers;
  let queryStringParameters = event.queryStringParameters;
  let stageVariables = event.stageVariables;
  let requestContext = event.requestContext;

  // Parse the input for the parameter values
  let tmp = event.methodArn.split(':');
  let apiGatewayArnTmp = tmp[5].split('/');
  let awsAccountId = tmp[4];
  let region = tmp[3];
  let ApiId = apiGatewayArnTmp[0];
  let stage = apiGatewayArnTmp[1];
  let route = apiGatewayArnTmp[2];

  // Perform authorization to return the Allow policy for correct parameters and
  // the 'Unauthorized' error, otherwise.
  var authResponse = {};
  var condition = {};
  condition.IpAddress = {};

  if (true) {
    callback(null, generateAllow('me', event.methodArn));
  }  else {
    callback("Unauthorized");
  }
}

// Helper function to generate an IAM policy
var generatePolicy = function(principalId, effect, resource) {
  // Required output:
  var authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    var policyDocument = {};
    policyDocument.Version = '2012-10-17'; // default version
    policyDocument.Statement = [];
    var statementOne = {};
    statementOne.Action = 'execute-api:Invoke'; // default action
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  // Optional output with custom properties of the String, Number or Boolean type.
  authResponse.context = {
    "stringKey": "stringval",
    "numberKey": 123,
    "booleanKey": true
  };
  return authResponse;
}

var generateAllow = function(principalId, resource) {
  return generatePolicy(principalId, 'Allow', resource);
}

var generateDeny = function(principalId, resource) {
  return generatePolicy(principalId, 'Deny', resource);
}