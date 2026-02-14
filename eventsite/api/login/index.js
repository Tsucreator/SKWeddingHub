const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    console.log("Event received:", JSON.stringify(event));

    let email;
    try {
        const body = JSON.parse(event.body);
        email = body.email;
        console.log("Parsed email:", email);
    } catch (e) {
        console.error("Body parse error:", e);
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
        FilterExpression: '#e = :email',
        ExpressionAttributeNames: {
            '#e': 'email'
        },
        ExpressionAttributeValues: {
            ':email': email
        }
    };

    console.log("Scan params:", JSON.stringify(params));

    try {
        const result = await dynamo.send(new ScanCommand(params));
        console.log("Scan result:", JSON.stringify(result));

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
        console.error("DynamoDB error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: err.message || "Internal server error" })
        };
    }
};