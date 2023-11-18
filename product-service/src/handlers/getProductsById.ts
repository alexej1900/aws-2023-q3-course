import { buildResponse } from '../utils';

export const handler = async (event: any) => {
    try {
        console.log('helloProductsById', event);

        return buildResponse(200, {
            products: [],
        });
    } catch (error) {
        return buildResponse(500, {
            message: error.message,
        });
    }
}
