
import { APIGatewayTokenAuthorizerEvent } from "aws-lambda";

export async function handler(event: APIGatewayTokenAuthorizerEvent) {
  console.log('Authorizer event', JSON.stringify(event));

  let authToken: string = '';
  let effect: 'Deny' | 'Allow' = 'Deny';
  let methodArn: string = '';

  try {
    authToken = event.authorizationToken || '';
    methodArn = event.methodArn;
    if (!authToken) {
      return generatePolicy(authToken, effect, methodArn);
    }

    const [authType, encodedToken] = authToken.split(' ');
    if (authType !== 'Basic' || !encodedToken) {
      return generatePolicy(authToken, effect, methodArn);
    }

    const buff = Buffer.from(authToken, 'base64');
    const plainCreds = buff.toString('utf-8').split(':');
    const username = plainCreds[0];
    const password = plainCreds[1];

    console.log(`user: ${username}, password: ${password}`);

    const storedUserPassword = process.env[username];
    effect = !storedUserPassword || storedUserPassword != password ? 'Deny' : 'Allow';

    const policy = generatePolicy(authToken, event.methodArn, effect);

    return policy;
  } catch (error: any) {
    console.log('Authorization error', error);
    return generatePolicy(authToken, event.methodArn, effect);
  }
  
}

const generatePolicy = (principalId, resource, effect = 'Allow') => {
  return {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api: Invoke',
          Effect: effect, 
          Resource: [resource],
        }
      ]
    }
  }
}