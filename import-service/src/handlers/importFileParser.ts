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

export async function handler(event: S3Event) {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  const splitKey = key.split("/");
  const fileName = splitKey[splitKey.length - 1];

  console.log("bucket: ", bucket, "filePatch: ", key, "file name: ", fileName);

  if (!key.startsWith("uploaded/")) {
    return;
  }

  const client = new S3Client({ region: process.env.PRODUCT_AWS_REGION! });

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

    const streamEnd = new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on("data", (record) => {
          console.log("CSV file Row:", record);
        })
        .on("end", async () => {
          console.log("CSV file parsing finished");
          try {
            await client.send(copyObjectCommand);
            console.log("Sending parsed file to parsed folder");
            await client.send(deleteObjectCommand);
            console.log("Deleting file from uploaded folder");
            resolve(null);
          } catch (err) {
            reject(err);
          }
        })
        .on("error", (error) => {
          console.error("CSV file Parse Error:", error);
          reject(error);
        });
    });

    await streamEnd;

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