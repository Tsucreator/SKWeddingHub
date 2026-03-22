const { loadUploadByKey, copyUploadRecordToDrive } = require('./drive-copy');

exports.handler = async (event) => {
  console.log('Gallery drive copy event:', JSON.stringify(event));

  const records = Array.isArray(event?.Records) ? event.Records : [];
  if (!records.length) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, processed: 0 }),
    };
  }

  const results = [];

  for (const record of records) {
    const bucket = record?.s3?.bucket?.name;
    const encodedKey = record?.s3?.object?.key;
    const key = encodedKey ? decodeURIComponent(encodedKey.replace(/\+/g, ' ')) : '';

    if (!bucket || !key) {
      results.push({ ok: false, reason: 'missing_bucket_or_key' });
      continue;
    }

    try {
      const item = await loadUploadByKey({ bucket, key });
      const result = await copyUploadRecordToDrive(item);
      results.push({
        ok: true,
        bucket,
        key,
        guestId: item.guest_id,
        uploadId: item.upload_id,
        ...result,
      });
    } catch (error) {
      console.error('Failed to copy upload to Drive:', error);
      results.push({
        ok: false,
        bucket,
        key,
        message: error.message || 'Drive copy failed',
      });
    }
  }

  const hasError = results.some((result) => !result.ok);
  return {
    statusCode: hasError ? 207 : 200,
    body: JSON.stringify({
      ok: !hasError,
      processed: results.length,
      results,
    }),
  };
};