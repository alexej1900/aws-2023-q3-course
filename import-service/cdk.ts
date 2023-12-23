import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { ResponseType, TokenAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { config } from "dotenv";

config();

const app = new cdk.App();

const stack = new cdk.Stack(app, "ImportServiceStack", {
  env: { region: process.env.PRODUCT_AWS_REGION! },
});

const uploadBucket = s3.Bucket.fromBucketName(
  stack,
  "ImportBucket",
  process.env.IMPORT_BUCKET_NAME!,
);

const importQueue = sqs.Queue.fromQueueArn(stack, 'importQueue', process.env.SQS_ARN!);

const lambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
    BUCKET_NAME: process.env.IMPORT_BUCKET_NAME!,
    SQS_URL: importQueue.queueUrl,
  },
};

const importProductsFile = new NodejsFunction(
  stack,
  "ImportProductsFileLambda",
  {
    ...lambdaProps,
    functionName: "importProductsFile",
    entry: "src/handlers/importProductsFile.ts",
  }
);

const importFileParser = new NodejsFunction(stack, "ImportFileParserLambda", {
  ...lambdaProps,
  functionName: "importFileParser",
  entry: "src/handlers/importFileParser.ts",
});

uploadBucket.grantReadWrite(importProductsFile);
uploadBucket.grantReadWrite(importFileParser);
uploadBucket.grantDelete(importFileParser);
importQueue.grantSendMessages(importFileParser);

const api = new apiGateway.RestApi(stack, "ImportServiceApi", {
  restApiName: "ImportService",
  defaultCorsPreflightOptions: {
    allowHeaders: ["*"],
    allowOrigins: ["*"],
    allowMethods: apiGateway.Cors.ALL_METHODS,
  },
  apiKeySourceType: apiGateway.ApiKeySourceType.HEADER,
});

const importProductFilesIntegration = new apiGateway.LambdaIntegration(
  importProductsFile
);

const importProductFilesResource = api.root.addResource("import", {
  defaultCorsPreflightOptions: {
    allowHeaders: ["*"],
    allowOrigins: ['*'],
    allowMethods: apiGateway.Cors.ALL_METHODS,
  },
});

const authRole = new Role(stack, 'ImportProductsFileAuthorizerRole', {
  assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
});

const basicAuthorizer = lambda.Function.fromFunctionArn(
  stack,
  'basicAuthorizer',
  process.env.AUTHORIZER_ARN!,
);

const importProductsFileAuthorizer = new TokenAuthorizer(stack, 'ImportProductsFileAuthorizer', {
  handler: basicAuthorizer,
  assumeRole: authRole,
});

importProductFilesResource.addMethod('GET', importProductFilesIntegration, {
  requestParameters: {
    'method.request.querystring.name': true
  },
  methodResponses: [
    {
      statusCode: '200',
      responseParameters: {
        'method.response.header.Content-Type': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    },
  ],
  authorizationType: apiGateway.AuthorizationType.CUSTOM,
  authorizer: importProductsFileAuthorizer
});

api.addGatewayResponse('ImportProductsFileUnauthorized', {
  type: ResponseType.UNAUTHORIZED,
  statusCode: '401',
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'"
  },
});

api.addGatewayResponse('ImportProductsFileForbidden', {
  type: ResponseType.ACCESS_DENIED,
  statusCode: '403',
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'"
  },
});

authRole.addToPolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [basicAuthorizer.functionArn],
  }),
);

uploadBucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(importFileParser),
  { prefix: "uploaded/" }
);

new cdk.CfnOutput(stack, "Import service Url", {
  value: `${api.url}import`,
  description: `Import service API URL`,
});