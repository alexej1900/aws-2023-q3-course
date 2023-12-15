import { mockClient } from "aws-sdk-client-mock";
import { SNSClient } from "@aws-sdk/client-sns";
import { handler as catalogBatchProcess } from "../handlers/catalogBatchProcess";

jest.mock("../handlers/createProduct");

const snsMockClient = mockClient(SNSClient as any);
snsMockClient.onAnyCommand().resolves({});

const mockProduct = {
  id: "4261ec4b-b10c-48c5-9345-fc73c48a80ac",
  title: "Product1",
  description: "Short Description of Product1",
  price: 20,
  count: 5,
};

const { ...prouctData } = mockProduct;

const mockEvent = {
  Records: [
    {
      body: JSON.stringify(prouctData),
    },
  ],
};

describe("catalogBatchProcess function", () => {
  it("should create product", async () => {
    const result = await catalogBatchProcess(mockEvent);
    console.log('result', result)
    const res = JSON.parse(result.body);
    expect(snsMockClient.send.callCount).toBe(1);
    expect(res.message).toBe("Created 1 products");
  });

  it("should send email to SNS", async () => {
    await catalogBatchProcess(mockEvent);
    expect(snsMockClient.send.callCount).toBe(2);
  });
});