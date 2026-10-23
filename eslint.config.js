const js = require("@eslint/js");

module.exports = [
    {
        ignores: ["node_modules/**"]
    },

    js.configs.recommended,

{
    files: ["eslint.config.js"],
    languageOptions: {
        globals: {
            require: "readonly",
            module: "readonly"
        }
    }
},
    {
        files: ["server.js", "seed.js", "validate-json.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                require: "readonly",
                module: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                console: "readonly",
                process: "readonly",
                fetch: "readonly"
            }
        }
    },

    {
        files: ["public/**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "script",
            globals: {
                document: "readonly",
                localStorage: "readonly",
                fetch: "readonly",
                console: "readonly",
                alert: "readonly",
                window: "readonly"
            }
        }
    },

    {
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error"
        }
    }
];
