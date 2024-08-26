import _ from "lodash";
import { promisify } from "util";
import fnArgs from 'fn-args';
import status from "./status.js";
import config from "../env/config.js";
import migrationsDir from "../env/migrationsDir.js";
import hasCallback from '../utils/has-callback.js';

export default async (db, client) => {
    const downgraded = [];
    const statusItems = await status(db);
    const appliedItems = statusItems.filter(item => item.appliedAt !== "PENDING");
    const lastAppliedItem = _.last(appliedItems);

    if (lastAppliedItem) {
        try {
            const migration = await migrationsDir.loadMigration(lastAppliedItem.fileName);
            const down = hasCallback(migration.down) ? promisify(migration.down) : migration.down;

            const startTime = new Date();
            console.log(`Migrating Down  : ${lastAppliedItem.fileName}`);

            if (hasCallback(migration.down) && fnArgs(migration.down).length < 3) {
                // support old callback-based migrations prior to migrate-mongo 7.x.x
                await down(db);
            } else {
                await down(db, client);
            }

            const endTime = new Date();
            let timeDiff = endTime - startTime;
            timeDiff /= 1000;
            console.log(`Migrated Down   : ${lastAppliedItem.fileName} (${timeDiff}s)`);

        } catch (err) {
            console.warn(`Error           : ${lastAppliedItem.fileName}`);
            throw new Error(
                `Could not migrate down ${lastAppliedItem.fileName}: ${err.message}`
            );
        }
        const { changelogCollectionName } = await config.read();
        const changelogCollection = db.collection(changelogCollectionName);
        try {
            await changelogCollection.deleteOne({ fileName: lastAppliedItem.fileName });
            downgraded.push(lastAppliedItem.fileName);
        } catch (err) {
            throw new Error(`Could not update changelog: ${err.message}`);
        }
    }

    return downgraded;
};
