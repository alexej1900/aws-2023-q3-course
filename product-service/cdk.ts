import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const app = new cdk.App();


const stack = new cdk.Stack(app, "AWSProductServiseStack", {
  env: { region: process.env.PRODUCT_AWS_REGION! },
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
  },
};

const dynamoDBPolicy = new iam.PolicyStatement({
    actions: ["dynamodb:Scan", "dynamodb:Query", "dynamodb:GetItem", "dynamodb:PutItem"],
    resources: ["*"],
})

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

getProductsById.addToRolePolicy(dynamoDBPolicy)
getProductsList.addToRolePolicy(dynamoDBPolicy)
createProduct.addToRolePolicy(dynamoDBPolicy)

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