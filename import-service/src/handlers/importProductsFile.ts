import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { buildResponse } from "../utils/utils";
import { config } from "dotenv";

config();

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log("imporProductsFile log: ", event);

  const fileName = event.queryStringParameters?.name;

  const bucket = "aws-import-bucket";

  if (!fileName) {
    return buildResponse(400, {
      message: "File name is required",
    });
  }

  const client = new S3Client({ region: "eu-west-1" });
  const objectKey = `uploaded/${fileName}`;

  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: "text/csv",
  });

  try {
    
    await client.send(putCommand);
    const signedUrl = await getSignedUrl(client, putCommand, { expiresIn: 60 });
    return buildResponse(200, signedUrl);

  } catch (error: any) {

    return buildResponse(500, {
      message: error.message,
    });

  }
}