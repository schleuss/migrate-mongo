const { find } = require("lodash");
const md5File = require('md5-file')
const migrationsDir = require("../env/migrationsDir");
const path = require('path');
const config = require("../env/config");

module.exports = async db => {
  await migrationsDir.shouldExist();
  await config.shouldExist();
  const migrationPath = await migrationsDir.resolve();
  const fileNames = await migrationsDir.getFileNames();

  const { changelogCollectionName } = await config.read();
  const changelogCollection = db.collection(changelogCollectionName);
  const changelog = await changelogCollection.find({}).toArray();

  const statusTable = fileNames.map(fileName => {
    const itemInLog = find(changelog, { fileName });
    const appliedAt = itemInLog ? itemInLog.appliedAt.toJSON() : "PENDING";
    const appliedHash = itemInLog ? itemInLog.fileHash : '';
    const fileHash = md5File.sync(path.join(migrationPath, fileName));
    const hashOk = appliedHash === fileHash;
    return { fileName, appliedAt, hashOk};
  });

  return statusTable;
};
