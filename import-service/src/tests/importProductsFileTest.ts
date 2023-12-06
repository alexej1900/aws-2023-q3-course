import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { handler } from "../handlers/importProductsFile";

jest.mock("../utils/utils", () => ({
  buildResponse: jest.fn((status: number, data: any) => ({
    statusCode: status,
    body: JSON.stringify(data),
  })),
}));

describe("import products file lambda", () => {
  afterEach(() => {
    mockClient(S3Client).reset();
  });

  it("return status code 400 if file name is missing", async () => {
    const s3Mock = mockClient(S3Client);
    const event: any = {};
    s3Mock.on(PutObjectCommand).rejects(new Error("File name is missing"));
    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(response.body).toContain("Missing requested paramater: file name");
  });

  it("return status code 200 and create signed url for csv file", async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(PutObjectCommand).resolves({});

    const event: any = {
      queryStringParameters: {
        name: "file.csv",
      },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("/uploaded/file.csv");
  });

  it("return status code 500 if error uploading the file", async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(PutObjectCommand).rejects(new Error("Failed to upload"));

    const event: any = {
      queryStringParameters: {
        name: "file.csv",
      },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeDefined();
  });
});