const { randomUUID } = require('node:crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const dynamoClient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoClient);
const s3 = new S3Client({});

const GUESTS_TABLE_NAME = process.env.GUESTS_TABLE_NAME || 'WeddingGuests';
const UPLOADS_TABLE_NAME = process.env.UPLOADS_TABLE_NAME || 'WeddingGuestUploads';
const UPLOADS_BUCKET_NAME = process.env.UPLOADS_BUCKET_NAME || '';
const SIGNED_UPLOAD_EXPIRES_SECONDS = Number(process.env.SIGNED_UPLOAD_EXPIRES_SECONDS || 900);
const SIGNED_VIEW_EXPIRES_SECONDS = Number(process.env.SIGNED_VIEW_EXPIRES_SECONDS || 3600);
const MAX_IMAGE_BYTES = Number(process.env.MAX_IMAGE_BYTES || 20 * 1024 * 1024);
const MAX_VIDEO_BYTES = Number(process.env.MAX_VIDEO_BYTES || 150 * 1024 * 1024);

const ACTION_INIT_UPLOAD = 'initUpload';
const ACTION_COMPLETE_UPLOAD = 'completeUpload';
const ACTION_LIST_UPLOADS = 'listUploads';

const STATUS_PENDING = 'PENDING';
const STATUS_COMPLETE = 'COMPLETE';

const IMAGE_CONTENT_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const VIDEO_CONTENT_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
]);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const normalizeText = (value) => String(value || '').trim();
const normalizeEmail = (value) => normalizeText(value).toLowerCase();

const createResponse = (statusCode, body) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
});

const sanitizeFileName = (fileName) => {
  const trimmed = normalizeText(fileName);
  const sanitized = trimmed
    .normalize('NFKC')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return sanitized || 'upload';
};

const detectMediaKind = (contentType) => {
  if (IMAGE_CONTENT_TYPES.has(contentType)) {
    return 'image';
  }

  if (VIDEO_CONTENT_TYPES.has(contentType)) {
    return 'video';
  }

  return '';
};

const assertConfigured = () => {
  if (!UPLOADS_BUCKET_NAME) {
    throw new Error('UPLOADS_BUCKET_NAME is not configured');
  }
};

const loadGuest = async (guestId, email) => {
  const result = await dynamo.send(new GetCommand({
    TableName: GUESTS_TABLE_NAME,
    Key: {
      guest_id: guestId,
    },
  }));

  const guest = result.Item;
  if (!guest) {
    return null;
  }

  if (normalizeEmail(guest.email) !== email) {
    return null;
  }

  return guest;
};

const buildObjectKey = ({ guestId, uploadId, fileName }) => {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');

  return [
    'guest-uploads',
    year,
    month,
    day,
    `guest-${guestId}`,
    `${uploadId}-${sanitizeFileName(fileName)}`,
  ].join('/');
};

const mapUploadItem = async (item) => {
  const base = {
    uploadId: item.upload_id,
    guestId: item.guest_id,
    name: item.name,
    email: item.email,
    fileName: item.file_name,
    mediaKind: item.media_kind,
    contentType: item.content_type,
    fileSize: item.file_size,
    status: item.status,
    createdAt: item.created_at,
    completedAt: item.completed_at || null,
  };

  if (item.status !== STATUS_COMPLETE || !item.s3_key) {
    return base;
  }

  const previewUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: UPLOADS_BUCKET_NAME,
      Key: item.s3_key,
      ResponseContentType: item.content_type,
      ResponseContentDisposition: 'inline',
    }),
    { expiresIn: SIGNED_VIEW_EXPIRES_SECONDS }
  );

  return {
    ...base,
    previewUrl,
    previewUrlExpiresIn: SIGNED_VIEW_EXPIRES_SECONDS,
  };
};

const handleInitUpload = async (body) => {
  assertConfigured();

  const guestId = Number(body.guestId);
  const email = normalizeEmail(body.email);
  const fileName = normalizeText(body.fileName);
  const contentType = normalizeText(body.contentType).toLowerCase();
  const fileSize = Number(body.fileSize);

  if (!Number.isInteger(guestId) || !email || !fileName || !contentType || !Number.isFinite(fileSize)) {
    return createResponse(400, { ok: false, message: 'guestId, email, fileName, contentType, fileSize are required' });
  }

  const guest = await loadGuest(guestId, email);
  if (!guest) {
    return createResponse(401, { ok: false, message: 'Guest not found' });
  }

  const mediaKind = detectMediaKind(contentType);
  if (!mediaKind) {
    return createResponse(400, { ok: false, message: 'Unsupported file type' });
  }

  const byteLimit = mediaKind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (fileSize <= 0 || fileSize > byteLimit) {
    return createResponse(400, {
      ok: false,
      message: `${mediaKind} file exceeds size limit`,
      maxBytes: byteLimit,
    });
  }

  const uploadId = randomUUID();
  const objectKey = buildObjectKey({ guestId, uploadId, fileName });
  const createdAt = new Date().toISOString();

  await dynamo.send(new PutCommand({
    TableName: UPLOADS_TABLE_NAME,
    Item: {
      guest_id: guestId,
      upload_id: uploadId,
      name: normalizeText(guest.name),
      email,
      file_name: sanitizeFileName(fileName),
      original_file_name: fileName,
      content_type: contentType,
      media_kind: mediaKind,
      file_size: fileSize,
      status: STATUS_PENDING,
      s3_bucket: UPLOADS_BUCKET_NAME,
      s3_key: objectKey,
      created_at: createdAt,
      updated_at: createdAt,
    },
  }));

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: UPLOADS_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
      Metadata: {
        guestid: String(guestId),
        uploadid: uploadId,
      },
    }),
    { expiresIn: SIGNED_UPLOAD_EXPIRES_SECONDS }
  );

  return createResponse(200, {
    ok: true,
    uploadId,
    uploadUrl,
    objectKey,
    fileName: sanitizeFileName(fileName),
    mediaKind,
    maxBytes: byteLimit,
    expiresIn: SIGNED_UPLOAD_EXPIRES_SECONDS,
    guest: {
      guestId,
      name: normalizeText(guest.name),
      email,
    },
  });
};

const handleCompleteUpload = async (body) => {
  assertConfigured();

  const guestId = Number(body.guestId);
  const email = normalizeEmail(body.email);
  const uploadId = normalizeText(body.uploadId);

  if (!Number.isInteger(guestId) || !email || !uploadId) {
    return createResponse(400, { ok: false, message: 'guestId, email, uploadId are required' });
  }

  const guest = await loadGuest(guestId, email);
  if (!guest) {
    return createResponse(401, { ok: false, message: 'Guest not found' });
  }

  const uploadRecord = await dynamo.send(new GetCommand({
    TableName: UPLOADS_TABLE_NAME,
    Key: {
      guest_id: guestId,
      upload_id: uploadId,
    },
  }));

  const item = uploadRecord.Item;
  if (!item || item.email !== email) {
    return createResponse(404, { ok: false, message: 'Upload not found' });
  }

  try {
    await s3.send(new HeadObjectCommand({
      Bucket: UPLOADS_BUCKET_NAME,
      Key: item.s3_key,
    }));
  } catch (error) {
    console.error('Uploaded object not found:', error);
    return createResponse(409, { ok: false, message: 'Uploaded object not found in S3' });
  }

  const completedAt = new Date().toISOString();

  await dynamo.send(new UpdateCommand({
    TableName: UPLOADS_TABLE_NAME,
    Key: {
      guest_id: guestId,
      upload_id: uploadId,
    },
    UpdateExpression: 'SET #status = :status, completed_at = :completedAt, updated_at = :updatedAt',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': STATUS_COMPLETE,
      ':completedAt': completedAt,
      ':updatedAt': completedAt,
    },
  }));

  return createResponse(200, {
    ok: true,
    uploadId,
    status: STATUS_COMPLETE,
    completedAt,
    guest: {
      guestId,
      name: normalizeText(guest.name),
      email,
    },
  });
};

const handleListUploads = async (body) => {
  assertConfigured();

  const guestId = Number(body.guestId);
  const email = normalizeEmail(body.email);
  const limit = Math.min(Math.max(Number(body.limit || 20), 1), 50);

  if (!Number.isInteger(guestId) || !email) {
    return createResponse(400, { ok: false, message: 'guestId and email are required' });
  }

  const guest = await loadGuest(guestId, email);
  if (!guest) {
    return createResponse(401, { ok: false, message: 'Guest not found' });
  }

  const queryResult = await dynamo.send(new QueryCommand({
    TableName: UPLOADS_TABLE_NAME,
    KeyConditionExpression: 'guest_id = :guestId',
    ExpressionAttributeValues: {
      ':guestId': guestId,
    },
  }));

  const sortedItems = (queryResult.Items || [])
    .slice()
    .sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)))
    .slice(0, limit);

  const uploads = await Promise.all(sortedItems.map((item) => mapUploadItem(item)));

  return createResponse(200, {
    ok: true,
    guest: {
      guestId,
      name: normalizeText(guest.name),
      email,
    },
    uploads,
  });
};

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    console.error('Body parse error:', error);
    return createResponse(400, { ok: false, message: 'Invalid request body' });
  }

  try {
    switch (body.action) {
      case ACTION_INIT_UPLOAD:
        return await handleInitUpload(body);
      case ACTION_COMPLETE_UPLOAD:
        return await handleCompleteUpload(body);
      case ACTION_LIST_UPLOADS:
        return await handleListUploads(body);
      default:
        return createResponse(400, { ok: false, message: 'Unsupported action' });
    }
  } catch (error) {
    console.error('Gallery Lambda error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return createResponse(500, { ok: false, message: error.message || 'Internal server error' });
  }
};