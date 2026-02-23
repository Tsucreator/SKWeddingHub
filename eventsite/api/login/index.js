const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

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

const resolveSideCandidates = (side) => {
    const normalized = normalizeText(side);
    if (normalized === '新郎側' || normalized.toLowerCase() === 'groom') {
        return ['新郎側', 'groom'];
    }
    if (normalized === '新婦側' || normalized.toLowerCase() === 'bride') {
        return ['新婦側', 'bride'];
    }
    return [normalized, normalized];
};

exports.handler = async (event) => {
    console.log("Event received:", JSON.stringify(event));

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch (e) {
        console.error("Body parse error:", e);
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ message: "Invalid request" })
        };
    }

    const loginType = body.loginType || LOGIN_TYPE_EMAIL;

    let params;

    if (loginType === LOGIN_TYPE_EMAIL) {
        const email = normalizeEmail(body.email);
        if (!email) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: "Email is required" })
            };
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
        const [sidePrimary, sideAlt] = resolveSideCandidates(body.side);

        if (!kanaSei || !kanaMei || !sidePrimary) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: "kanaSei, kanaMei, side are required" })
            };
        }

        params = {
            TableName: TABLE_NAME,
            FilterExpression: '#s = :sidePrimary OR #s = :sideAlt',
            ExpressionAttributeNames: {
                '#s': 'side'
            },
            ExpressionAttributeValues: {
                ':sidePrimary': sidePrimary,
                ':sideAlt': sideAlt
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
                return {
                    statusCode: 200,
                    headers: CORS_HEADERS,
                    body: JSON.stringify(matchedGuest)
                };
            }

            return {
                statusCode: 401,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: "Guest not found" })
            };
        } catch (err) {
            console.error("DynamoDB error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
            return {
                statusCode: 500,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: err.message || "Internal server error" })
            };
        }
    } else {
        return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ message: "Unsupported loginType" })
        };
    }

    console.log("Scan params:", JSON.stringify(params));

    try {
        const result = await dynamo.send(new ScanCommand(params));
        console.log("Scan result:", JSON.stringify(result));

        if (result.Items && result.Items.length > 0) {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify(result.Items[0])
            };
        } else {
            return {
                statusCode: 401,
                headers: CORS_HEADERS,
                body: JSON.stringify({ message: "Guest not found" })
            };
        }
    } catch (err) {
        console.error("DynamoDB error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ message: err.message || "Internal server error" })
        };
    }
};