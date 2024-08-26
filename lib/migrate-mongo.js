import init from "./actions/init.js";
import create from "./actions/create.js";
import up from "./actions/up.js";
import down from "./actions/down.js";
import rehash from "./actions/rehash.js";
import status from "./actions/status.js";
import database from "./env/database.js";
import config from "./env/config.js";

export default {
    init,
    create,
    up,
    down,
    rehash,
    status,
    database,
    config
};
