import _ from "lodash";
import md5File from 'md5-file';
import path from 'path';
import fs from 'fs';
import migrationsDir from "../env/migrationsDir.js";
import config from "../env/config.js";

export default async db => {
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
        if (curr && curr.fileName) {
            const idx = curr.fileName.replace(/\\/g, "/");
            map[idx] = curr;
        }
        return map;
    }, {});

    const statusTable = fileNames.map(fileName => {
        const idx = fileName.replace(/\\/g, "/");
        const itemInLog = changeLogByName[idx];
        const appliedAt = itemInLog ? itemInLog.appliedAt.toJSON() : "PENDING";
        const appliedHash = itemInLog ? itemInLog.fileHash : '';
        const filePath = path.join(migrationPath, fileName);
        const fileHash = fs.existsSync(filePath) ? md5File.sync(filePath) : '';
        const hashOk = appliedHash === fileHash;
        const timestampName = path.basename(fileName);
        return {
            fileName,
            appliedAt,
            fileHash,
            hashOk,
            timestampName
        };
    });

    const sortedTable = _.sortBy(statusTable, ['appliedAt', 'timestampName']);

    return sortedTable.map(curr => {
        delete curr.timestampName;
        return curr;
    });

};