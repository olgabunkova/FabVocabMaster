module.exports = [
    {
        ignores: ['dist', 'node_modules'],
    },
    {
        files: ['src/**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                document: 'readonly',
                window: 'readonly',
                navigator: 'readonly',
            },
        },
        rules: {},
    },
];
