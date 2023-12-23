import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from "aws-lambda";
import { config } from "dotenv";

config();


export const handler = async(event: APIGatewayTokenAuthorizerEvent) => {
  console.log('Authorizer event', JSON.stringify(event));

  const TestUserName = 'alexej1900';
  const TestserPassword = 'TEST_PASSWORD';

  let authToken: string = '';
  let effect: 'Deny' | 'Allow' = 'Deny';
  let methodArn: string = '';

  try {
    authToken = event.authorizationToken || '';

    console.log( `authToken ${authToken}`);

    methodArn = event.methodArn;
    if (!authToken) {
      return generatePolicy(authToken, methodArn, effect);
    }

    const [authType, encodedToken] = authToken.split(' ');
    console.log( `AuthType ${authType}, EncodedToken ${encodedToken}`);

    if (authType !== 'Basic' || !encodedToken) {
      return generatePolicy(authToken, methodArn, effect);
    }

    const buff = Buffer.from(encodedToken, 'base64');
    const plainCreds = buff.toString('utf-8').split(':');

    const username = plainCreds[0];
    const password = plainCreds[1];

    console.log(`user: ${username}, password: ${password}`);

    const storedUserPassword = process.env.CREDENTIALS;
    console.log(`storedUserPassword: ${storedUserPassword}`);

    effect = username === TestUserName && password === TestserPassword ?  'Allow' : 'Deny';

    // effect = !storedUserPassword || storedUserPassword != password ? 'Deny' : 'Allow';
    

    if (effect === "Allow") {
      console.log(`effect: ${JSON.stringify({
        principalId: 'user',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'execute-api:Invoke',
              Effect: 'Allow',
              Resource: event.methodArn,
            },
          ],
        },
      })}`);

      return {
        principalId: 'user',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'execute-api:Invoke',
              Effect: 'Allow',
              Resource: event.methodArn,
            },
          ],
        },
      };
    } else {
      return {
        principalId: 'user',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'execute-api:Invoke',
              Effect: 'Deny',
              Resource: event.methodArn,
            },
          ],
        },
      };
    }
    
  } catch (error: any) {
    console.log('Authorization error', error);
    return generatePolicy(authToken, event.methodArn, effect);
  }
  
}

const generatePolicy = (
    principalId: string, 
    resource: string, 
    effect: 'Allow' | 'Deny'
  ): APIGatewayAuthorizerResult => {
  return {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api: Invoke',
          Effect: effect, 
          Resource: resource,
        }
      ]
    }
  }
}