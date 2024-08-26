import globals from "globals";

export default [
    // ...other config
    {
        files: [
            "test/**"
        ],
        languageOptions: {
            globals: {
                ...globals.mocha
            }
        }
    }
];
