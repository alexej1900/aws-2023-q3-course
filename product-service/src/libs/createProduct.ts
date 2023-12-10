import { DynamoDBClient, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

import { config } from "dotenv";

config();

const client = new DynamoDBClient({});

const docClient = DynamoDBDocument.from(client);

export const createProduct = async (product: {
        id: string;
        title: string;
        description: string;
        price: number;
        count: number;
    }) => {

    const transactItems = [
        {
            Put: {
            TableName: "products",
                Item: {
                    id: { S: product.id, }, 
                    title:{ S: product.title },
                    description: { S: product.description },
                    price: { N: product.price.toString() },
                },
            },
        },
        {
            Put: {
                TableName: "stocks",
                Item: {
                    product_id: { S: product.id, },
                    count: { N: product.count.toString() },
                },
            },
        },
    ];

    try {
        const command = new TransactWriteItemsCommand({ TransactItems: transactItems });
        const products = await docClient.send(command);

        console.log("TransactWriteCommand products", products);
        return ({...product})
    } catch (err) {
        console.log("TransactWriteCommand", err);
        return err;
    }
};
