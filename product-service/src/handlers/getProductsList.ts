import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { buildResponse } from '../utils';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export async function handler(event: any) {
  try {
    console.log("getProductsList log: ", event);

    const productsDb = new ScanCommand({
      TableName: "products",
    });

    const stocksDb = new ScanCommand({
      TableName: "stocks",
    });

    const products = await docClient.send(productsDb);

    if (!products) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Products not found" }),
      };
    }

    const stocks = await docClient.send(stocksDb);

    const productsWithCount = products.Items?.map((product) => {
        const stock = stocks.Items!.find((el) => el.product_id === product.id)
        return {
            ...product,
            count: stock?.count || 0,
        }
    });

    return buildResponse(200, productsWithCount || []);
  } catch (err: any) {
    return buildResponse(500, {
      message: err.message,
    });
  }
}