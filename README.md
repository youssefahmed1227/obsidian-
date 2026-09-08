# Executive CRM

High-performance dark mode CRM with local file-based data storage, history tracking with day names and timestamps, Executive Dashboard, and master Client Directory.

---

## 🚀 Deploying to GitHub Pages

This project is fully configured for zero-friction deployment to **GitHub Pages**.

### Method 1: Automatic Deployment (Recommended — GitHub Actions)

A GitHub Actions workflow is already configured at `.github/workflows/deploy.yml`.

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** > **Pages**
   - Under **Build and deployment** > **Source**, select **GitHub Actions**
3. That's it! Every time you push to `main` (or `master`), GitHub Actions will automatically build and publish your CRM app.

---

### Method 2: Manual Deployment via `gh-pages` CLI

If you prefer deploying directly from your terminal:

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```
2. Run the deploy script:
   ```bash
   npm run deploy
   ```
3. In your GitHub repository **Settings** > **Pages**, ensure the source is set to deploy from the `gh-pages` branch (`/ (root)`).

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production distribution
npm run build

# Preview production build locally
npm run preview
```
