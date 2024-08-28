import fs from "fs-extra";
import path from "path";
import _ from "lodash";

const DEFAULT_CONFIG_FILE_NAME = "migrate-mongo-config.js";

let customConfigContent = null;

function getConfigPath() {
    const fileOptionValue = _.get(global.options, "file");
    if (!fileOptionValue) {
        return path.join(process.cwd(), DEFAULT_CONFIG_FILE_NAME);
    }

    if (path.isAbsolute(fileOptionValue)) {
        return fileOptionValue;
    }
    return path.join(process.cwd(), fileOptionValue);
}

export default {
    DEFAULT_CONFIG_FILE_NAME,

    set(configContent) {
        customConfigContent = configContent
    },

    async shouldExist() {
        if (!customConfigContent) {
            const configPath = getConfigPath();
            try {
                await fs.stat(configPath);
            } catch (err) {
                throw new Error(`config file does not exist: ${configPath}`);
            }
        }
    },

    async shouldNotExist() {
        if (!customConfigContent) {
            const configPath = getConfigPath();
            const error = new Error(`config file already exists: ${configPath}`);
            try {
                await fs.stat(configPath);
                throw error;
            } catch (err) {
                if (err.code !== "ENOENT") {
                    throw error;
                }
            }
        }
    },

    getConfigFilename() {
        return path.basename(getConfigPath());
    },

    async read() {
        if (customConfigContent) {
            return customConfigContent;
        }

        const configPath = getConfigPath();
        const data = (await import(configPath)).default;

        this.set(data);

        return data;
    }
};
