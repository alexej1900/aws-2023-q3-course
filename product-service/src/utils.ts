import {Product} from '../types/types';

export const buildResponse = (statusCode: number, body: { product?: Product; products?: Product[]; message?: string; }) => ({
    statusCode: statusCode,
    headers: {
        'Access-Control-Allow-Credentials': true,
        'Access-Control_Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
    },
    body: JSON.stringify(body),
})