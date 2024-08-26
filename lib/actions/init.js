import fs from "fs-extra";
import path from "path";
import migrationsDir from "../env/migrationsDir.js";
import config from "../env/config.js";

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

function copySampleConfigFile() {
  const source = path.join(__dirname, "../../samples/migrate-mongo-config.js");
  const destination = path.join(
    process.cwd(),
    config.DEFAULT_CONFIG_FILE_NAME
  );
  return fs.copy(source, destination);
}

function createMigrationsDirectory() {
  return fs.mkdirs(path.join(process.cwd(), "migrations"));
}

export default async () => {
  await migrationsDir.shouldNotExist();
  await config.shouldNotExist();
  await copySampleConfigFile();
  return createMigrationsDirectory();
};
