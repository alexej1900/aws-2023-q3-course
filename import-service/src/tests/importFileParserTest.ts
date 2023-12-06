import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { sdkStreamMixin } from "@aws-sdk/util-stream-node";
import { mockClient } from "aws-sdk-client-mock";
import { createReadStream } from "fs";

import { handler } from "../handlers/importFileParser";
import { S3EventRecord } from "aws-lambda";

const s3Mock = mockClient(S3Client);

const testEvent: { Records: Partial<S3EventRecord>[] } = {
  Records: [
    {
      s3: {
        bucket: {
          name: "test",
          arn: "test",
          ownerIdentity: {
            principalId: "test",
          },
        },
        object: {
          key: "test.csv",
          size: 1,
          eTag: "test",
          sequencer: "test",
        },
        s3SchemaVersion: "",
        configurationId: "",
      },
    },
  ],
};

it("ImportFileParser should parse the file", async () => {
  const consoleLogSpy = jest.spyOn(console, "log");
  const stream = createReadStream("tests/test.csv");
  const sdkStream = sdkStreamMixin(stream);
  s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });
  const s3 = new S3Client({});

  // @ts-expect-error
  const result = await handler(testEvent, {}, () => ({}));

  const recordsCalls = consoleLogSpy.mock.calls.filter(
    ([firstArg]) => firstArg === "Record:"
  );
  expect(recordsCalls).toHaveLength(4);
  consoleLogSpy.mockRestore();
});

it("ImportFileParser should handle error", async () => {
  const stream = createReadStream("tests/test.csv");

  stream.pipe = jest.fn(() => {
    throw new Error("Error during pipe");
  });
  const sdkStream = sdkStreamMixin(stream);
  s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });

  // @ts-expect-error
  await expect(handler(testEvent, {}, () => ({}))).rejects.toThrow(
    "Error during pipe"
  );
});