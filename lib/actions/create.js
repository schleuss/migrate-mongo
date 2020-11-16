const fs = require("fs-extra");
const path = require("path");
const date = require("../utils/date");
const migrationsDir = require("../env/migrationsDir");

module.exports = async description => {
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
  let subpath = description.split(path.sep);
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
  return filename;
};
