import { buildResponse } from '../utils';
import { products } from '../data/data';
import { Product } from 'types/types';

export const handler = async (event: any) => {
    try {
        console.log('helloProductsById', event);
        const requestedId = event.pathParameters.productId;
        let res:Product;

        for(var i=0; i < products.length; i++) {

            if (products[i].id === requestedId) {
                res = products[i];

                return buildResponse(200, res);
            }    
        }

        if (res === undefined) {
            return buildResponse(400, {
                message: 'Product not found, invalid ID supplied',
            });
        } 
    } catch (error) {
        return buildResponse(500, {
            message: error.message,
        });
    }
}
