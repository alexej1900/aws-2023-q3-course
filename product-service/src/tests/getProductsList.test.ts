import {describe, expect, test} from '@jest/globals';
import { handler } from '../handlers/getProductsList';

describe('Products list', () => {
    test('handler returns non-empty responce', async () => {
        const data = await handler({});
        expect(data).not.toBeUndefined();
    });
    
    test('handler returns object with definite fields', async () => {
        const data = await handler({});
        expect(data).toEqual(expect.objectContaining(
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
})