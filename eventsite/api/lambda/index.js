const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event));

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // OPTIONS (CORS preflight)
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // table_id をクエリパラメータから取得
  const tableId = event.queryStringParameters?.table_id;

  if (!tableId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "table_id is required" }),
    };
  }

  const params = {
    TableName: "WeddingGuests",
    FilterExpression: "#t = :tableId",
    ExpressionAttributeNames: {
      "#t": "table_id",
      "#n": "name",
    },
    ExpressionAttributeValues: {
      ":tableId": tableId,
    },
    // 必要最小限の属性のみ取得（スループット節約）
    ProjectionExpression: "seat_id, #n, relationship, honorific",
  };

  try {
    const result = await dynamo.send(new ScanCommand(params));
    console.log(`Table ${tableId}: ${result.Items?.length || 0} guests found`);

    // seat_id 順にソートして返す
    const seats = (result.Items || [])
      .map((item) => ({
        seat_id: item.seat_id,
        name: item.name,
        relationship: item.relationship || "",
        honorific: item.honorific || "",
      }))
      .sort((a, b) => Number(a.seat_id) - Number(b.seat_id));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ table_id: tableId, seats }),
    };
  } catch (err) {
    console.error("DynamoDB error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: err.message || "Internal server error" }),
    };
  }
};
