const {
  sortBy
} = require("lodash");
const md5File = require('md5-file')
const path = require('path');
const fs = require('fs');
const migrationsDir = require("../env/migrationsDir");
const config = require("../env/config");

module.exports = async db => {
  await migrationsDir.shouldExist();
  await config.shouldExist();
  const migrationPath = await migrationsDir.resolve();
  const fileNames = await migrationsDir.getFileNames();

  const {
    changelogCollectionName
  } = await config.read();
  const changelogCollection = db.collection(changelogCollectionName);
  const changelog = await changelogCollection.find({}).toArray();

  const changeLogByName = changelog.reduce((map, curr) => {
    map[curr.fileName] = curr;
    return map;
  }, {});

  const statusTable = fileNames.map(fileName => {
    const itemInLog = changeLogByName[fileName];
    const appliedAt = itemInLog ? itemInLog.appliedAt.toJSON() : "PENDING";
    const appliedHash = itemInLog ? itemInLog.fileHash : '';
    const filePath = path.join(migrationPath, fileName);
    const fileHash = fs.existsSync(filePath) ? md5File.sync(filePath) : '';
    const hashOk = appliedHash === fileHash;
    const timestampName = path.basename(fileName);
    return {
      fileName,
      appliedAt,
      hashOk,
      timestampName
    };
  });

  const sortedTable = sortBy(statusTable, ['appliedAt', 'timestampName']);

  return sortedTable.map(curr => {
    delete curr.timestampName;
    return curr;
  });

};