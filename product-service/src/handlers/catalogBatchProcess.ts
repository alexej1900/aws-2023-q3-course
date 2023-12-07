import { PublishCommand } from "@aws-sdk/client-sns";
import { createProduct } from "../libs/createProduct";
import { snsClient } from "../libs/snsClient";
import { v4 as uuidv4 } from "uuid";
import { buildResponse } from 'src/utils';

export const handler = async (event) => {
    try {
        console.log('sqs event', event);

        const { Records } = event;

        for (const record of Records) {
            const data = JSON.parse(record.body);

            const { description, title, price, count } = data;

            const uuid = uuidv4();
            const product = {
                id: uuid,
                description,
                title,
                price: Number(price),
                count: Number(count),
            };

            const newProductsData = await createProduct(product);

            console.log(newProductsData);

            await snsClient.send(
                new PublishCommand({
                    Subject: 'New files added to catalog',
                    Message: JSON.stringify(newProductsData),
                    TopicArn: process.env.IMPORT_PRODUCTS_TOPIC_ARN,
                    MessageAttributes:{
                        count: {
                            DataType: 'Number',
                            StringValue: newProductsData.count,
                        },
                    },
                })
            );
        }

        return buildResponse(200, Records);

    } catch (err) {
        console.log(err);
        return buildResponse(500, err);
    }
}