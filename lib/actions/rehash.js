import _ from "lodash";
import md5File from 'md5-file';
import path from 'path';
import fs from 'fs';
import pEachSeries from "p-each-series";
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

    if(!Array.isArray(changelog) || changelog.length == 0 ) {
        // nothing to process... 
        return [];
    }

    const changeLogByName = changelog.reduce((map, curr) => {
        const idx = curr.fileName.replace(/\\/g, "/");
        map[idx] = curr;
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
    const changedItems = _.filter(sortedTable, { hashOk: false });

    const updateItem = async item => {
        const { fileName, fileHash } = item;

        const idx = fileName.replace(/\\/g, "/");
        const itemInLog = changeLogByName[idx];

        try {
            if(itemInLog) {
                await changelogCollection.updateOne({ fileName: itemInLog.fileName }, { $set: { fileHash } });
            }
        } catch (err) {
            throw new Error(`Could not update changelog: ${err.message}`);
        }
    };

    await pEachSeries(changedItems, updateItem);

    return changedItems.map(curr => {
        delete curr.timestampName;
        return curr;
    });

};