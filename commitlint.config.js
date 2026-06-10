const PROJECT_CODE = "LV"; //Input project code here

module.exports = {
    rules: {
        'commit-match': [2, 'always', '\\w+-\\d+'],
        'commit-project-code': [2, 'always', PROJECT_CODE]
    },
    plugins: [
        {
            rules: {
                'commit-match': (parsed, when, value) => {
                    const { raw = '' } = parsed;
                    if (!value) {
                        return [true];
                    }
                    const regex = new RegExp(value, 'ig');
                    const matched = raw.match(regex) != null;
                    return [
                        matched,
                        'Commit allow: {PROJECT_CODE}-{ISSUE_CODE}: {COMMIT_MESSAGE}',
                    ];
                },
                'commit-project-code': (parsed, when, value) => {
                    const { raw = '' } = parsed;
                    if (!value) {
                        return [true];
                    }
                    const regex = new RegExp(`^${value}`, 'g');
                    const matched = raw.match(regex) != null;
                    return [
                        matched,
                        `Project code allow: ${value}-{ISSUE_CODE}: {COMMIT_MESSAGE}`,
                    ];
                },
            },
        },
    ],
    ignores: [
        (message) => /^WIP|^Update|^Add|^Delete/i.test(message),
        (message) => message.startsWith('Update from Shopify for theme')
    ],
    defaultIgnores: true,
}