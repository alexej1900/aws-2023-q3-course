import { PublishCommand } from "@aws-sdk/client-sns";
import { createProduct } from "../libs/createProduct";
import { snsClient } from "../libs/snsClient";
import { v4 as uuidv4 } from "uuid";
import { buildResponse } from '../utils';

export const handler = async (event: { Records: any; }) => {
    try {
        console.log('sqs event', event);

        const Records = event.Records;

        for (const record of Records) {
            const data = JSON.parse(record.body);

            const { Description, Title, Price, Count } = data;
            const uuid = uuidv4();
            const product = {
                id: uuid,
                title: Title,
                description: Description,
                price: Number(Price),
                count: Number(Count),
            };

            const newProductsData = await createProduct(product);

            console.log('Created products', newProductsData);

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

        return buildResponse(200, {
            message: "Created " + Records.length + " products",
            Records,
          });

    } catch (err) {
        console.log(err);
        return buildResponse(500, err);
    }
}