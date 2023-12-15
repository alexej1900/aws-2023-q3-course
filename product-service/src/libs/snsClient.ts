import { SNSClient } from "@aws-sdk/client-sns";

const REGION = process.env.PRODUCT_AWS_REGION!; 

export const snsClient = new SNSClient({ region: REGION });