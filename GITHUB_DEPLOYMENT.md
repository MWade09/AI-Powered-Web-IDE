# GitHub Deployment Guide

This document provides step-by-step instructions for deploying the Advanced Web IDE to GitHub and making it accessible via GitHub Pages.

## Prerequisites

- [Git](https://git-scm.com/) installed on your local machine
- A [GitHub](https://github.com/) account
- The Advanced Web IDE project files

## Step 1: Create a GitHub Repository

1. Log in to your GitHub account
2. Click the "+" icon in the top-right corner and select "New repository"
3. Enter a repository name (e.g., "advanced-web-ide")
4. Add an optional description
5. Choose public or private visibility (public is required for free GitHub Pages)
6. Optionally initialize with a README (not necessary as we already have one)
7. Click "Create repository"

## Step 2: Initialize Git in Your Project

If you haven't already initialized Git in your project, do so with these commands:

```bash
cd /path/to/advanced-web-ide
git init
```

## Step 3: Configure Git

Set up your Git user information:

```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## Step 4: Add Your GitHub Repository as Remote

```bash
git remote add origin https://github.com/yourusername/advanced-web-ide.git
```

Replace `yourusername` with your actual GitHub username and `advanced-web-ide` with your repository name.

## Step 5: Add and Commit Your Files

```bash
git add .
git commit -m "Initial commit"
```

## Step 6: Push to GitHub

```bash
git push -u origin main
```

Note: If your default branch is named `master` instead of `main`, use:

```bash
git push -u origin master
```

## Step 7: Set Up GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings"
3. Scroll down to the "GitHub Pages" section
4. Under "Source", select the branch you want to deploy (usually `main` or `master`)
5. Select the root folder (/) as the source
6. Click "Save"
7. Wait a few minutes for GitHub Pages to build your site
8. GitHub will provide a URL where your site is published (usually `https://yourusername.github.io/advanced-web-ide/`)

## Step 8: Verify Deployment

1. Visit the URL provided by GitHub Pages
2. Ensure all features are working correctly
3. Test the editor functionality
4. Verify that the API key input works properly

## Additional Notes

### Custom Domain (Optional)

If you want to use a custom domain:

1. In your repository's "Settings" > "GitHub Pages" section
2. Under "Custom domain", enter your domain name
3. Save the changes
4. Configure your domain's DNS settings to point to GitHub Pages

### Updating Your Deployment

When you make changes to your project:

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

GitHub Pages will automatically update your site after you push changes.

### Troubleshooting

If your site doesn't appear or doesn't work correctly:

1. Check the GitHub Pages section in repository settings for any error messages
2. Ensure all file paths are relative, not absolute
3. Verify that all required files are included in your repository
4. Check browser console for any JavaScript errors

## Important Security Note

Remember that GitHub repositories are public by default. The OpenRouter API key is entered by users in their browser and is not stored in the repository, so there are no security concerns regarding API keys in your code.
