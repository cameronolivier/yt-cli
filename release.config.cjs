const localDryRun = Boolean(process.env.LOCAL_DRY_RUN);

module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    ['@semantic-release/npm', { npmPublish: true }],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version}\n\n${nextRelease.notes}',
      },
    ],
    // Only include GitHub plugin when not in local dry-run to avoid network calls
    ...(!localDryRun ? ['@semantic-release/github'] : []),
  ],
};
