import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import "dotenv/config";

const app = new cdk.App();

const stack = new cdk.Stack(app, "AuthorizationServiceStack", {
  env: { region: process.env.PRODUCT_AWS_REGION! },
});

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
  },
}

const basicAuthorizer = new NodejsFunction(stack, 'BasicAuthorizerLambda', {
  ...sharedLambdaProps,
  entry: 'src/handlers/basicAuthorizer.ts',
  functionName: 'basicAuthorizer',
});

new cdk.CfnOutput(stack, 'basicAuthorizerArn', {
  value: basicAuthorizer.functionName,
});

