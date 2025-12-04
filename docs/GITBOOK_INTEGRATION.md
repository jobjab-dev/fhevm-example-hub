# GitBook Integration Guide

This repository is designed to be easily integrated into the official [Zama FHEVM Documentation](https://docs.zama.ai/fhevm).

## 📂 Directory Structure

The `docs/` folder is structured to match standard GitBook organization:

```text
docs/
├── SUMMARY.md          # Table of Contents (Auto-generated)
├── chapters/           # Category Introduction pages
└── examples/           # Individual Example pages
    ├── basic/
    ├── encryption/
    ├── concepts/
    └── ...
```

## 🚀 How to Integrate

### Option 1: Import as a Content Source (Recommended)

1.  In your GitBook Space settings, go to **Git Sync**.
2.  Connect this repository.
3.  Set the **Content Directory** to `docs`.
4.  GitBook will automatically use `SUMMARY.md` to build the sidebar navigation.

### Option 2: Copy-Paste Integration

If merging into an existing documentation repo:

1.  Copy the `docs/examples` folder into your target repository's documentation root.
2.  Copy the contents of `docs/SUMMARY.md`.
3.  Paste the entries into your main `SUMMARY.md` under a new section (e.g., "Example Hub").

## 🔄 Updating Documentation

Whenever new examples are added to the Hub:

1.  Run the generator:
    ```bash
    npm run docs
    ```
2.  This updates both the individual `.md` files and re-generates `SUMMARY.md`.
3.  Commit and push changes. GitBook will sync automatically.

## 🎨 Markdown Compatibility

The generated markdown uses standard syntax supported by GitBook:
- Frontmatter (`id`, `title`, `description`)
- Code blocks with syntax highlighting (`solidity`, `typescript`)
- Tables and Lists
- Hint/Callout syntax (can be customized in `scripts/generate-docs.ts` if needed)

