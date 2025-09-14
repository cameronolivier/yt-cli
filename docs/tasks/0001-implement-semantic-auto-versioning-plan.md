# Plan for Implementing Semantic Auto-Versioning

## 1. Goal

Implement semantic auto-versioning for the `yt-cli` project. This will automate the process of versioning and publishing the package based on conventional commit messages.

## 2. Strategy

I will use the `semantic-release` library to automate the versioning and release process. This will involve the following steps:

### 2.1. Install Dependencies

I will install `semantic-release` and its necessary plugins as dev dependencies:

```bash
pnpm install -D semantic-release @semantic-release/changelog @semantic-release/commit-analyzer @semantic-release/exec @semantic-release/git @semantic-release/release-notes-generator
```

### 2.2. Configure `package.json`

I will add a `release` configuration to the `package.json` file. This configuration will define the `semantic-release` plugins and their settings.

```json
{
  "release": {
    "branches": ["main"],
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      "@semantic-release/changelog",
      ["@semantic-release/npm", {
        "npmPublish": false
      }],
      ["@semantic-release/git", {
        "assets": ["package.json", "CHANGELOG.md"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }]
    ]
  }
}
```

### 2.3. Update `pnpm` Scripts

I will add a new script to `package.json` for running `semantic-release`:

```json
{
  "scripts": {
    "release": "semantic-release"
  }
}
```

### 2.4. Create a `.releaserc` file

I will create a `.releaserc` file to configure semantic-release.

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    ["@semantic-release/npm", {
      "npmPublish": false
    }],
    ["@semantic-release/git", {
      "assets": ["package.json", "CHANGELOG.md"],
      "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
    }]
  ]
}
```

### 2.5. Git and CI

I will assume that the user will be responsible for setting up the CI environment with the necessary tokens for git authentication. I will not be performing any commits or pushes to the repository.

## 3. Verification

After the changes are implemented, I will run `pnpm run release --dry-run` to verify that the configuration is correct and that `semantic-release` can determine the next version based on the commit history.

```