import { buildResponse } from '../utils';
import { products } from '../data/data';
import { Product } from 'types/types';

export const handler = async (event: any) => {
    try {
        console.log('helloProductsById', event);
        const requestedId = event.body.id;
        let res:Product;

        for(var i=0; i < products.length; i++) {

            if (products[i].id === requestedId) {
                res = products[i];

                return buildResponse(200, {
                    product: res,
                });
            }    
        }

        if (res === undefined) {
            return buildResponse(200, {
                message: 'Product not found',
            });
        } 
    } catch (error) {
        return buildResponse(500, {
            message: error.message,
        });
    }
}
