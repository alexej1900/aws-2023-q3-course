import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { config } from "dotenv";

config();

const app = new cdk.App();

const stack = new cdk.Stack(app, "AWSProductServiseStack", {
  env: { region: process.env.PRODUCT_AWS_REGION! },
});

const importQueue = new sqs.Queue(stack, 'CatalogItemsQueue', {
  queueName: 'catalogItemsQueue',
});

const importProductTopic = new sns.Topic(stack, 'CreateProductsTopic', {
  topicName: 'createProductsTopic',
});

new sns.Subscription(stack, 'CreateProductTopicSubscription', {
  endpoint: process.env.BIG_STACK_EMAIL as string,
  protocol: sns.SubscriptionProtocol.EMAIL,
  topic: importProductTopic,
})

new sns.Subscription(stack, "CreateProductTopicBigCountSubscription", {
  topic: importProductTopic,
  protocol: sns.SubscriptionProtocol.EMAIL,
  endpoint: process.env.ADDITIONAL_EMAIL as string,
  filterPolicy: {
    count: sns.SubscriptionFilter.numericFilter({ greaterThan: 5 }),
  },
});

const productsTable = dynamodb.Table.fromTableName(stack, 'ProductsTable', `products`);
const stocksTable = dynamodb.Table.fromTableName(stack, 'StocksTable', `stocks`);

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
    DYNAMODB_TABLE_NAME_PRODUCTS: productsTable.tableName,
    DYNAMODB_TABLE_NAME_STOCKS: stocksTable.tableName,
    DYNAMODB_TABLE_ARN_PRODUCTS: productsTable.tableArn,
    DYNAMODB_TABLE_ARN_STOCKS: stocksTable.tableArn,
    IMPORT_PRODUCTS_TOPIC_ARN: importProductTopic.topicArn,
  },
};

const dynamoDBPolicy = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ["dynamodb:Scan", "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query"],
  resources: ["*"],
});

const getProductsList = new NodejsFunction(stack, "GetProductsListLambda", {
  ...sharedLambdaProps,
  functionName: "getProductsList",
  entry: "src/handlers/getProductsList.ts",
});

const getProductsById = new NodejsFunction(stack, "GetProductsByIdLambda", {
  ...sharedLambdaProps,
  functionName: "getProductsById",
  entry: "src/handlers/getProductsById.ts",
});

const createProduct = new NodejsFunction(stack, "CreateProductLambda", {
  ...sharedLambdaProps,
  functionName: "createProduct",
  entry: "src/handlers/createProduct.ts",
});

const catalogBatchProcess = new NodejsFunction(stack, "CatalogBatchProcessLambda", {
  ...sharedLambdaProps,
  functionName: "catalogBatchProcess",
  entry: "src/handlers/catalogBatchProcess.ts",
});

importProductTopic.grantPublish(catalogBatchProcess);
catalogBatchProcess.addEventSource(new SqsEventSource(importQueue, { batchSize: 5 }));

getProductsById.addToRolePolicy(dynamoDBPolicy)
getProductsList.addToRolePolicy(dynamoDBPolicy)
createProduct.addToRolePolicy(dynamoDBPolicy)
catalogBatchProcess.addToRolePolicy(dynamoDBPolicy)

const api = new apiGateway.HttpApi(stack, "ProductApi", {
  corsPreflight: {
    allowHeaders: ["*"],
    allowOrigins: ["*"],
    allowMethods: [apiGateway.CorsHttpMethod.ANY],
  },
});

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "GetProductsListIntegration",
    getProductsList
  ),
  path: "/products",
  methods: [apiGateway.HttpMethod.GET],
});

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "GetProductsByIdIntegration'",
    getProductsById
  ),
  path: "/products/{productId}",
  methods: [apiGateway.HttpMethod.GET],
});

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "CreateProductIntegration",
    createProduct
  ),
  path: "/products",
  methods: [apiGateway.HttpMethod.POST],
});