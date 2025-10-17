import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
const accessKey = process.env.ACCESS_KEY || '';
const secret = process.env.SECRET_ACCESS_KEY || '';
const client = new DynamoDBClient({
    region: "eu-north-1", // 
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secret,
    },
});
const db = DynamoDBDocumentClient.from(client);
const tableName = 'Ghibly';
export { db, tableName };
//# sourceMappingURL=dynamoDB.js.map