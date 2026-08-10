# Deployment notes

## GitHub

- Repository: [https://github.com/srab2001/raven_demo](https://github.com/srab2001/raven_demo)
- Push the current branch to GitHub to connect Vercel.

## Vercel

- Import the GitHub repository into Vercel.
- Use the root of this repository as the project root.
- Use the root `npm run build` command and `dist` output directory; both are configured in [vercel.json](vercel.json).
- Production is available at [raven-squares-build-package-1.vercel.app](https://raven-squares-build-package-1.vercel.app), with demos at `/demo1`, `/demo2`, and `/demo3`.
- For local run and deployment steps, see [USER_GUIDE.md](USER_GUIDE.md).
