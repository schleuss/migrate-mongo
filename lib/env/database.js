const { MongoClient } = require("mongodb");
const _ = require("lodash");
const config = require("./config");

module.exports = {
    async connect() {
        const configContent = await config.read();
        const url = _.get(configContent, "mongodb.url");

        const options = _.get(configContent, "mongodb.options");

        if (!url) {
            throw new Error("No `url` defined in config file!");
        }

        const client = await MongoClient.connect(
            url,
            options
        );

        // use config databaseName or provided in connection string
        const databaseName = _.get(configContent, "mongodb.databaseName", client.s.options.dbName);
        const db = client.db(databaseName);
        db.close = client.close;
        return {
            client,
            db,
        };
    }
};
