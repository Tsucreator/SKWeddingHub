const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    // API Gateway経由の場合、bodyは文字列で来るのでパースが必要
    let email;
    try {
        const body = JSON.parse(event.body);
        email = body.email;
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ message: "Invalid request" }) };
    }

    const params = {
        TableName: 'WeddingGuests',
        Key: { email: email }
    };

    try {
        const result = await dynamo.send(new GetCommand(params));
        if (result.Item) {
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*", // 本番ではドメインを絞るのが理想
                    "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                },
                body: JSON.stringify(result.Item)
            };
        } else {
            return {
                statusCode: 401,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ message: "Guest not found" })
            };
        }
    } catch (err) {
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(err)
        };
    }
};