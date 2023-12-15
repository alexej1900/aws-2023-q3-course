import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as sqs from "aws-cdk-lib/aws-sqs";
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

const api = new apiGateway.HttpApi(stack, "ImportApi", {
  corsPreflight: {
    allowHeaders: ["*"],
    allowOrigins: ["*"],
    allowMethods: [apiGateway.CorsHttpMethod.ANY],
  },
});

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

uploadBucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(importFileParser),
  { prefix: "uploaded/" }
);

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "ImportProductFileIntegration",
    importProductsFile
  ),
  path: "/import",
  methods: [apiGateway.HttpMethod.GET],
});

new cdk.CfnOutput(stack, "Import service Url", {
  value: `${api.url}import`,
  description: `Import service API URL`,
});