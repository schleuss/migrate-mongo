import _ from "lodash";
import pEachSeries from "p-each-series";
import { promisify } from "util";
import fnArgs from 'fn-args';
import path from 'path';
import fs from 'fs';
import md5File from 'md5-file';
import status from "./status.js";
import config from "../env/config.js";
import migrationsDir from "../env/migrationsDir.js";
import hasCallback from '../utils/has-callback.js';

export default async (db, client) => {
    const statusItems = await status(db);
    const pendingItems = _.filter(statusItems, { appliedAt: "PENDING" });
    const changedItems = _.filter(statusItems, { hashOk: false });
    const migrationPath = await migrationsDir.resolve();
    const migrated = [];

    const warningChangedFiles = async item => {
        if (item.appliedAt !== "PENDING") {
            console.warn(`File ${item.fileName} was changed since the last execution`);
        }
    };

    const migrateItem = async item => {
        try {
            const migration = await migrationsDir.loadMigration(item.fileName);
            const up = hasCallback(migration.up) ? promisify(migration.up) : migration.up;

            const startTime = new Date();
            console.log(`Migrating   : ${item.fileName}`);
            if (hasCallback(migration.up) && fnArgs(migration.up).length < 3) {
                // support old callback-based migrations prior to migrate-mongo 7.x.x
                await up(db);
            } else {
                await up(db, client);
            }

            const endTime = new Date();
            let timeDiff = endTime - startTime;
            timeDiff /= 1000;
            console.log(`Migrated    : ${item.fileName} (${timeDiff}s)`);

        } catch (err) {
            console.warn(`Error       : ${item.fileName}`);
            const error = new Error(
                `Could not migrate up ${item.fileName}: ${err.message}`
            );
            error.migrated = migrated;
            throw error;
        }

        const { changelogCollectionName } = await config.read();
        const changelogCollection = db.collection(changelogCollectionName);

        const { fileName } = item;
        const appliedAt = new Date();
        const filePath = path.join(migrationPath, fileName);
        const fileHash = fs.existsSync(filePath) ? md5File.sync(filePath) : '';

        try {
            await changelogCollection.insertOne({ fileName, appliedAt, fileHash });
        } catch (err) {
            throw new Error(`Could not update changelog: ${err.message}`);
        }
        migrated.push(item.fileName);
    };

    await pEachSeries(changedItems, warningChangedFiles);
    await pEachSeries(pendingItems, migrateItem);
    return migrated;
};
