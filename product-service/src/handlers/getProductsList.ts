import { buildResponse } from '../utils';
import { products } from '../data/data';

export const handler = async (event: any) => {
    try {
        return buildResponse(200, products);
    } catch (error) {
        return buildResponse(500, {
            message: error.message,
        });
    }
}
