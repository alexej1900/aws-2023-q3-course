import {describe, expect, test} from '@jest/globals';
import { handler } from '../handlers/getProductsById';
import { APIGatewayProxyEvent } from 'aws-lambda/trigger/api-gateway-proxy';

describe('Handler that returns one product by ID in request', () => {

    const event: APIGatewayProxyEvent = {
        pathParameters: {
            productId: "7567ec4b-b10c-48c5-9345-fc73c48a80aa"
        }
    } as any
    
    test('handler returns non-empty responce', async () => {
        const result = await handler(event);
        expect(result).not.toBeUndefined();
    });
    
    test('verifies successful response', async () => {
        const result = await handler(event);

        expect(result).toEqual(expect.objectContaining(
            {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Credentials': true,
                    'Access-Control_Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                }
            } 
        )) 
    });

    test('response with product data', async () => {
        const result = await handler(event);

        expect(result.body).toEqual(JSON.stringify({
            id: "7567ec4b-b10c-48c5-9345-fc73c48a80aa",
            description: "Short Python For Dummies Description",
            price: "24",
            title: "Python For Dummies",
            count: "2"
        }));
    });

    test('return error message with wrong ID', async () => {
        const event: APIGatewayProxyEvent = {
            pathParameters: {
                productId: "erwerwerwe"
            }
        } as any
        const result = await handler(event);
        expect(result.statusCode).toEqual(400);

        expect(result.body).toEqual(JSON.stringify({
            message: "Product not found"
        }));
    });
})
