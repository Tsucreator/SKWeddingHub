const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'WeddingGuests';
const LOGIN_TYPE_EMAIL = 'email';
const LOGIN_TYPE_KANA = 'kana';

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
};

const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const normalizeEmail = (value) => normalizeText(value).toLowerCase();

const normalizeKanaForMatch = (value) =>
    String(value || '')
        .normalize('NFKC')
        .replace(/[\s　]+/g, '')
        .trim();

const normalizeSide = (side) => normalizeText(side);

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body)
});

exports.handler = async (event) => {
    console.log("Event received:", JSON.stringify(event));

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch (e) {
        console.error("Body parse error:", e);
        return createResponse(400, { message: "Invalid request" });
    }

    if (body.action === 'verifyGiftAccess') {
        const guestId = Number(body.guestId);
        const email = normalizeEmail(body.email);

        if (!Number.isInteger(guestId) || !email) {
            return createResponse(400, { ok: false, message: "guestId and email are required" });
        }

        try {
            const result = await dynamo.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    guest_id: guestId
                }
            }));

            const guest = result.Item;

            if (!guest) {
                return createResponse(401, { ok: false, message: "Guest not found" });
            }

            const registeredEmail = normalizeEmail(guest.email);
            if (registeredEmail !== email) {
                return createResponse(401, { ok: false, message: "Guest not found" });
            }

            return createResponse(200, {
                ok: true,
                guest_id: guest.guest_id,
                gift_url: guest.gift_url || null
            });
        } catch (err) {
            console.error("DynamoDB error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
            return createResponse(500, { ok: false, message: err.message || "Internal server error" });
        }
    }

    const loginType = body.loginType || LOGIN_TYPE_EMAIL;

    let params;

    if (loginType === LOGIN_TYPE_EMAIL) {
        const email = normalizeEmail(body.email);
        if (!email) {
            return createResponse(400, { message: "Email is required" });
        }

        params = {
            TableName: TABLE_NAME,
            FilterExpression: '#e = :email',
            ExpressionAttributeNames: {
                '#e': 'email'
            },
            ExpressionAttributeValues: {
                ':email': email
            }
        };
    } else if (loginType === LOGIN_TYPE_KANA) {
        const kanaSei = normalizeKanaForMatch(body.kanaSei);
        const kanaMei = normalizeKanaForMatch(body.kanaMei);
        const inputKana = `${kanaSei}${kanaMei}`;
        const side = normalizeSide(body.side);

        if (!kanaSei || !kanaMei || !side) {
            return createResponse(400, { message: "kanaSei, kanaMei, side are required" });
        }

        if (side !== '新郎' && side !== '新婦') {
            return createResponse(400, { message: "side must be 新郎 or 新婦" });
        }

        params = {
            TableName: TABLE_NAME,
            FilterExpression: '#s = :side',
            ExpressionAttributeNames: {
                '#s': 'side'
            },
            ExpressionAttributeValues: {
                ':side': side
            }
        };

        console.log("Scan params:", JSON.stringify(params));

        try {
            const result = await dynamo.send(new ScanCommand(params));
            console.log("Scan result:", JSON.stringify(result));

            const matchedGuest = (result.Items || []).find((guest) => {
                const guestKana = normalizeKanaForMatch(guest.kana);
                return guestKana === inputKana;
            });

            if (matchedGuest) {
                return createResponse(200, matchedGuest);
            }

            return createResponse(401, { message: "Guest not found" });
        } catch (err) {
            console.error("DynamoDB error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
            return createResponse(500, { message: err.message || "Internal server error" });
        }
    } else {
        return createResponse(400, { message: "Unsupported loginType" });
    }

    console.log("Scan params:", JSON.stringify(params));

    try {
        const result = await dynamo.send(new ScanCommand(params));
        console.log("Scan result:", JSON.stringify(result));

        if (result.Items && result.Items.length > 0) {
            return createResponse(200, result.Items[0]);
        } else {
            return createResponse(401, { message: "Guest not found" });
        }
    } catch (err) {
        console.error("DynamoDB error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
        return createResponse(500, { message: err.message || "Internal server error" });
    }
};