const { scanUploadRecords, copyUploadRecordToDrive } = require('./drive-copy');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    limit: 0,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--limit') {
      options.limit = Number(args[index + 1] || 0);
      index += 1;
    }
  }

  return options;
};

const main = async () => {
  const options = parseArgs();
  const items = await scanUploadRecords({
    limit: options.limit > 0 ? options.limit : 0,
    statusFilter: 'COMPLETE',
    onlyUncopied: true,
  });

  console.log(`Found ${items.length} upload records to backfill`);

  for (const item of items) {
    const label = `${item.guest_id}/${item.upload_id} ${item.original_file_name || item.file_name}`;

    if (options.dryRun) {
      console.log(`[dry-run] ${label}`);
      continue;
    }

    try {
      const result = await copyUploadRecordToDrive(item);
      console.log(`[copied] ${label} -> ${result.driveFileId}`);
    } catch (error) {
      console.error(`[failed] ${label}: ${error.message || error}`);
    }
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});