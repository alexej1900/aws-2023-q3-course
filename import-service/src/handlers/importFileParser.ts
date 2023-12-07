import { S3Event } from "aws-lambda";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import csv from "csv-parser";
import { buildResponse } from "../utils/utils";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { config } from "dotenv";

config();

export async function handler(event: S3Event) {
  const recrds = event.Records;
  if (!recrds.length) throw new Error('No records found');

  const bucket = recrds[0].s3.bucket.name;
  const key = recrds[0].s3.object.key;
  const splitKey = key.split("/");
  const fileName = splitKey[splitKey.length - 1];

  console.log("bucket: ", bucket, "filePatch: ", key, "file name: ", fileName);

  if (!key.startsWith("uploaded/")) {
    return;
  }

  const client = new S3Client({ region: process.env.PRODUCT_AWS_REGION! });
  const sqsClient = new SQSClient({ region: process.env.PRODUCT_AWS_REGION! });

  try {

    const params = {
      Bucket: bucket,
      Key: key,
    };

    const copyParams = {
      ...params,
      Key: `parsed/${fileName}`,
      CopySource: `${bucket}/${key}`,
    };

    const getObjectCommand = new GetObjectCommand(params);
    const copyObjectCommand = new CopyObjectCommand(copyParams);
    const deleteObjectCommand = new DeleteObjectCommand(params);

    const { Body } = await client.send(getObjectCommand);

    if (!Body) {
      throw new Error("No object data found");
    }

    const stream = Body as Readable;

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on("data", async (record) => {
          console.log("CSV file Row:", record);
          stream.pause();
          try {
            await sqsClient.send(
              new SendMessageCommand({
                QueueUrl: process.env.SQS_URL!,
                MessageBody: JSON.stringify(record),
              })
            );
            console.log(`Message to SQS -> ${process.env.SQS_URL!}`, record);
          } catch (err) {
            console.log(`Error message to SQS -> ${process.env.SQS_URL}`, record);
            reject(err);
          }

          stream.resume();
        })
        .on("end", async () => {
          console.log("CSV file parsing finished");
          const copyObject = await client.send(copyObjectCommand);
          console.log("Objects copied to folder /parsed:", copyObject);
          const deleteObject = await client.send(deleteObjectCommand);
          console.log("Objects deleted from folder /uploaded:", deleteObject);
          resolve(null);
        })
        .on("error", (error) => {
          console.error("CSV file Parse Error:", error);
          reject(error);
        });
    });

    return buildResponse(200, {
      message: "Parsed successful",
    });
  } catch (error: any) {
    console.error(error);
    return buildResponse(500, {
      message: error.message,
    });
  }
}