import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dotenv from 'dotenv';
dotenv.config();

const app = new cdk.App();

const stack = new cdk.Stack(app, "AuthorizationServiceStack", {
  env: { region: process.env.PRODUCT_AWS_REGION! },
});

const basicAuthorizer = new NodejsFunction(stack, 'BasicAuthorizerLambda', {
  runtime: lambda.Runtime.NODEJS_18_X,
  functionName: 'basicAuthorizer',
  entry: 'src/handlers/basicAuthorizer.ts',
  environment: {
    alexej1900: process.env.alexej1900!,
  },
});

new cdk.CfnOutput(stack, 'BasicAuthorizerLambdaArn', {
  value: basicAuthorizer.functionArn,
});

