import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb"
import { formatData } from "../formatData"
import { buildResponse } from '../utils';
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });
const docClient  = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
    console.log("event:", event);
  try {

    const requestedId = event.pathParameters.productId;
    console.log("requestedId:", requestedId);

    if (!requestedId) {
      throw new Error("id was not provided")
    }

    const productsCommand = new QueryCommand({
      TableName: "products",
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {":id": { "S": requestedId } },
    })

    const stockCommand = new QueryCommand({
      TableName: "stocks",
      KeyConditionExpression: "product_id = :product_id",
      ExpressionAttributeValues: {":product_id": { "S": requestedId } },
    })

    const product = await docClient.send(productsCommand)
    const stock = await docClient.send(stockCommand)

    console.log("product:", product);
    console.log("stock:", stock);

    if (!product) {
      return buildResponse(400, "Product not found")
    }

    const formattedProduct = formatData(product)
    const formattedStock = formatData(stock)

    const body = {
      ...formattedProduct.Items,
      count: formattedStock?.Items.count || 0,
    }

    return buildResponse(200, body)
    
  } catch (error: any) {
    const body = error.stack || JSON.stringify(error, null, 2)
    console.error("Error:", error);
    return buildResponse(500, body)
  }
}
