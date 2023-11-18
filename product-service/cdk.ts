import * as apiGateway from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';

const app = new cdk.App();

const stack = new cdk.Stack(app, "AWSProductServiseStack", {
    env: { region: 'eu-west-1' }
})

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
    runtime: lambda.Runtime.NODEJS_18_X,
    environment: {
        PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
    }
}

const getProductsList = new NodejsFunction(stack, 'GetProductsListLambda', {
    ...sharedLambdaProps,
    functionName: 'getProductsList',
    entry: 'src/handlers/getProductsList.ts'
})

const getProductsListById = new NodejsFunction(stack, 'GetProductsListByIdLambda', {
    ...sharedLambdaProps,
    functionName: 'getProductsListById',
    entry: 'src/handlers/getProductsListById.ts'
})

const api = new apiGateway.HttpApi(stack, 'ProductApi', {
    corsPreflight: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: [apiGateway.CorsHttpMethod.ANY],
    }
})

api.addRoutes({
    integration: new HttpLambdaIntegration('GetProductsListIntegration', getProductsList),
    path: '/products',
    methods: [apiGateway.HttpMethod.GET],
})

api.addRoutes({
    integration: new HttpLambdaIntegration('GetProductsListByIdIntegration', getProductsListById),
    path: '/products/{productId}',
    methods: [apiGateway.HttpMethod.GET],
})
