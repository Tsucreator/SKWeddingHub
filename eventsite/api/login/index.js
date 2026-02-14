const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    let email;
    try {
        const body = JSON.parse(event.body);
        email = body.email;
    } catch (e) {
        return {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Invalid request" })
        };
    }

    if (!email) {
        return {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Email is required" })
        };
    }

    const params = {
        TableName: 'WeddingGuests',
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
            ':email': email
        }
    };

    try {
        const result = await dynamo.send(new ScanCommand(params));
        if (result.Items && result.Items.length > 0) {
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                },
                body: JSON.stringify(result.Items[0])
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