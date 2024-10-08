import fs from "fs-extra";
import path from "path";
import date from "../utils/date.js";
import migrationsDir from "../env/migrationsDir.js";

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

export default async description => {
  if (!description) {
    throw new Error("Missing parameter: description");
  }
  await migrationsDir.shouldExist();
  const migrationsDirPath = await migrationsDir.resolve();
  const migrationExtension = await migrationsDir.resolveMigrationFileExtension();

  // Check if there is a 'sample-migration.js' file in migrations dir - if there is, use that
  let source;
  if (await migrationsDir.doesSampleMigrationExist()) {
    source = await migrationsDir.resolveSampleMigrationPath();
  } else {
    source = path.join(__dirname, "../../samples/migration.js");
  }

  let filename = description;
  // split on multiple path separators
  let subpath = description.split(/[\\\/]/);
  if( subpath.length > 1 ) {
    filename = subpath.pop();
    subpath = subpath.join(path.sep);
  } else {
    subpath = '';
  }

  filename = `${date.nowAsString()}-${filename
    .split(" ")
    .join("_")}${migrationExtension}`;
  const destination = path.join(path.join(migrationsDirPath, subpath), filename);
  await fs.copy(source, destination);
  const dirPath = await migrationsDir.configMigrationsDir();
  return path.join(path.join(dirPath, subpath), filename);
};
