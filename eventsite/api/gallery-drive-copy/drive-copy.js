const path = require('node:path');
const { Readable } = require('node:stream');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { S3Client, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const { google } = require('googleapis');

const dynamoClient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoClient);
const s3 = new S3Client({});

const UPLOADS_TABLE_NAME = process.env.UPLOADS_TABLE_NAME || 'WeddingGuestUploads';
const GOOGLE_DRIVE_FOLDER_ID = String(process.env.GOOGLE_DRIVE_FOLDER_ID || '').trim();
const GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL = String(process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL || '').trim();
const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = String(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '')
  .replace(/\\n/g, '\n')
  .trim();
const GOOGLE_OAUTH_CLIENT_ID = String(process.env.GOOGLE_OAUTH_CLIENT_ID || '').trim();
const GOOGLE_OAUTH_CLIENT_SECRET = String(process.env.GOOGLE_OAUTH_CLIENT_SECRET || '').trim();
const GOOGLE_OAUTH_REFRESH_TOKEN = String(process.env.GOOGLE_OAUTH_REFRESH_TOKEN || '').trim();

const DRIVE_COPY_STATUS_PENDING = 'PENDING';
const DRIVE_COPY_STATUS_COPIED = 'COPIED';
const DRIVE_COPY_STATUS_FAILED = 'FAILED';

const normalizeText = (value) => String(value || '').trim();

const assertConfigured = () => {
  if (!GOOGLE_DRIVE_FOLDER_ID) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured');
  }

  const hasServiceAccountAuth = GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL && GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const hasOAuthAuth = GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET && GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!hasServiceAccountAuth && !hasOAuthAuth) {
    throw new Error(
      'Google Drive auth is not configured. Set GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, or set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REFRESH_TOKEN'
    );
  }
};

const getDriveClient = () => {
  assertConfigured();

  let auth;

  if (GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET && GOOGLE_OAUTH_REFRESH_TOKEN) {
    auth = new google.auth.OAuth2(
      GOOGLE_OAUTH_CLIENT_ID,
      GOOGLE_OAUTH_CLIENT_SECRET
    );
    auth.setCredentials({
      refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN,
    });
  } else {
    auth = new google.auth.JWT({
      email: GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      key: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
  }

  return google.drive({ version: 'v3', auth });
};

const streamToBuffer = async (stream) => {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

const splitFileName = (fileName) => {
  const extension = path.extname(fileName);
  if (!extension) {
    return {
      stem: fileName,
      extension: '',
    };
  }

  return {
    stem: fileName.slice(0, -extension.length),
    extension,
  };
};

const buildDriveFileName = (item) => {
  const guestName = normalizeText(item.name).replace(/[\\/:*?"<>|]/g, '_');
  const sourceName = normalizeText(item.original_file_name || item.file_name || item.upload_id || 'upload');
  const { stem, extension } = splitFileName(sourceName);

  if (!guestName) {
    return sourceName;
  }

  const suffix = `_${guestName}`;
  if (stem.endsWith(suffix)) {
    return sourceName;
  }

  return `${stem}${suffix}${extension}`;
};

const loadUploadByKey = async ({ bucket, key }) => {
  const headResult = await s3.send(new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  }));

  const guestId = Number(headResult.Metadata?.guestid);
  const uploadId = normalizeText(headResult.Metadata?.uploadid);

  if (!Number.isInteger(guestId) || !uploadId) {
    throw new Error(`S3 object metadata guestid/uploadid is missing for ${key}`);
  }

  const result = await dynamo.send(new GetCommand({
    TableName: UPLOADS_TABLE_NAME,
    Key: {
      guest_id: guestId,
      upload_id: uploadId,
    },
  }));

  if (!result.Item) {
    throw new Error(`Upload record not found for guest_id=${guestId}, upload_id=${uploadId}`);
  }

  return result.Item;
};

const readS3Object = async ({ bucket, key }) => {
  const result = await s3.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  }));

  return streamToBuffer(result.Body);
};

const bufferToReadable = (buffer) => Readable.from(buffer);

const updateCopyState = async (item, values) => {
  const now = new Date().toISOString();
  const expressionNames = {
    '#updatedAt': 'updated_at',
  };
  const expressionValues = {
    ':updatedAt': now,
  };
  const segments = ['#updatedAt = :updatedAt'];

  Object.entries(values).forEach(([key, value]) => {
    const nameKey = `#${key}`;
    const valueKey = `:${key}`;
    expressionNames[nameKey] = key;
    expressionValues[valueKey] = value;
    segments.push(`${nameKey} = ${valueKey}`);
  });

  await dynamo.send(new UpdateCommand({
    TableName: UPLOADS_TABLE_NAME,
    Key: {
      guest_id: item.guest_id,
      upload_id: item.upload_id,
    },
    UpdateExpression: `SET ${segments.join(', ')}`,
    ExpressionAttributeNames: expressionNames,
    ExpressionAttributeValues: expressionValues,
  }));
};

const copyUploadRecordToDrive = async (item) => {
  if (!item?.s3_bucket || !item?.s3_key) {
    throw new Error('Upload record is missing s3_bucket or s3_key');
  }

  if (item.drive_copy_status === DRIVE_COPY_STATUS_COPIED && normalizeText(item.drive_file_id)) {
    return {
      ok: true,
      skipped: true,
      reason: 'already_copied',
      driveFileId: item.drive_file_id,
      driveFileName: item.drive_file_name || buildDriveFileName(item),
    };
  }

  const nextAttempt = Number(item.drive_copy_attempts || 0) + 1;
  await updateCopyState(item, {
    drive_copy_status: DRIVE_COPY_STATUS_PENDING,
    drive_copy_attempts: nextAttempt,
    drive_copy_error: null,
  });

  try {
    const drive = getDriveClient();
    const body = await readS3Object({
      bucket: item.s3_bucket,
      key: item.s3_key,
    });
    const driveFileName = buildDriveFileName(item);

    const response = await drive.files.create({
      requestBody: {
        name: driveFileName,
        parents: [GOOGLE_DRIVE_FOLDER_ID],
        description: `guest_id=${item.guest_id}, upload_id=${item.upload_id}, s3_key=${item.s3_key}`,
      },
      media: {
        mimeType: item.content_type || 'application/octet-stream',
        body: bufferToReadable(body),
      },
      fields: 'id,name,webViewLink',
      supportsAllDrives: true,
    });

    const copiedAt = new Date().toISOString();
    await updateCopyState(item, {
      drive_copy_status: DRIVE_COPY_STATUS_COPIED,
      drive_file_id: response.data.id,
      drive_file_name: response.data.name || driveFileName,
      drive_file_link: response.data.webViewLink || null,
      drive_folder_id: GOOGLE_DRIVE_FOLDER_ID,
      drive_copied_at: copiedAt,
      drive_copy_error: null,
    });

    return {
      ok: true,
      skipped: false,
      driveFileId: response.data.id,
      driveFileName: response.data.name || driveFileName,
      driveFileLink: response.data.webViewLink || null,
    };
  } catch (error) {
    await updateCopyState(item, {
      drive_copy_status: DRIVE_COPY_STATUS_FAILED,
      drive_copy_error: error.message || 'Drive copy failed',
    });

    throw error;
  }
};

const scanUploadRecords = async ({ limit, statusFilter, onlyUncopied }) => {
  const items = [];
  let lastEvaluatedKey;

  do {
    const response = await dynamo.send(new ScanCommand({
      TableName: UPLOADS_TABLE_NAME,
      ExclusiveStartKey: lastEvaluatedKey,
      Limit: limit ? Math.min(limit - items.length, 100) : 100,
    }));

    for (const item of response.Items || []) {
      if (statusFilter && item.status !== statusFilter) {
        continue;
      }

      if (onlyUncopied && item.drive_copy_status === DRIVE_COPY_STATUS_COPIED && normalizeText(item.drive_file_id)) {
        continue;
      }

      items.push(item);
      if (limit && items.length >= limit) {
        return items;
      }
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
};

module.exports = {
  DRIVE_COPY_STATUS_COPIED,
  DRIVE_COPY_STATUS_FAILED,
  DRIVE_COPY_STATUS_PENDING,
  buildDriveFileName,
  copyUploadRecordToDrive,
  loadUploadByKey,
  scanUploadRecords,
};