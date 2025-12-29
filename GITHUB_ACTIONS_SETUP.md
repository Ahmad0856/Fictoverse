# GitHub Actions Setup for Static Page Generation

This guide explains how to automatically run `node generate-static-pages.js` on GitHub using GitHub Actions.

## What It Does

The GitHub Actions workflow will:
1. Automatically run when you push to the `main` or `master` branch
2. Run daily at midnight UTC (optional - can be disabled)
3. Generate all static pages using `generate-static-pages.js`
4. Automatically commit and push the generated files back to your repository

## Setup Instructions

### 1. Push the Workflow File

The workflow file has been created at `.github/workflows/generate-static-pages.yml`. 

**Important:** Make sure to commit and push this file to your repository:

```bash
git add .github/workflows/generate-static-pages.yml
git commit -m "Add GitHub Actions workflow for static page generation"
git push
```

### 2. Configure Repository Permissions

For the workflow to push changes back to your repository, you need to enable write permissions:

1. Go to your GitHub repository
2. Click **Settings** → **Actions** → **General**
3. Scroll down to **Workflow permissions**
4. Select **Read and write permissions**
5. Check **Allow GitHub Actions to create and approve pull requests** (optional)
6. Click **Save**

### 3. (Optional) Use GitHub Secrets for Supabase Credentials

If you want to keep your Supabase credentials secure (though they're already in the script), you can use GitHub Secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key
4. Update the workflow file to use these secrets (currently commented out)

## How It Works

### Automatic Triggers

The workflow runs automatically when:
- You push code to `main` or `master` branch
- Daily at midnight UTC (scheduled)

### Manual Trigger

You can also trigger it manually:
1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select **Generate Static Pages** workflow
4. Click **Run workflow** button
5. Select the branch and click **Run workflow**

## Workflow Steps

1. **Checkout repository** - Gets your code
2. **Setup Node.js** - Installs Node.js 18
3. **Install dependencies** - Runs `npm install`
4. **Generate static pages** - Runs `node generate-static-pages.js`
5. **Check for changes** - Verifies if any files were generated/modified
6. **Commit and push** - Commits the generated files with message "Auto-generate static pages [skip ci]"

## Customization

### Change Schedule

Edit `.github/workflows/generate-static-pages.yml` and modify the `schedule` section:

```yaml
schedule:
  - cron: '0 0 * * *'  # Daily at midnight UTC
  # Examples:
  # '0 */6 * * *' - Every 6 hours
  # '0 0 * * 0' - Weekly on Sunday
```

### Change Branches

Modify the `branches` section:

```yaml
push:
  branches:
    - main
    - master
    - develop  # Add more branches
```

### Disable Scheduled Runs

Remove or comment out the `schedule` section if you only want manual/push triggers.

## Troubleshooting

### Workflow Not Running

1. Check that `.github/workflows/generate-static-pages.yml` is committed and pushed
2. Verify the file is in the correct location
3. Check the **Actions** tab for any error messages

### Permission Errors

1. Ensure **Workflow permissions** are set to **Read and write**
2. Check that the `GITHUB_TOKEN` has write access

### No Changes Committed

- If no files changed, the workflow will skip the commit step (this is normal)
- Check the workflow logs to see what was generated

## Viewing Workflow Runs

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Click on a workflow run to see detailed logs
4. Check the "Generate static pages" step to see the output

## Notes

- The workflow uses `[skip ci]` in commit messages to prevent infinite loops
- Generated files are automatically committed and pushed
- The workflow runs on Ubuntu (latest) with Node.js 18
- All dependencies are installed automatically via `npm install`


