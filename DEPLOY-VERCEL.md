# Firestone Vercel Deployment

This project is a static website. Vercel should serve the repository root directly.

## Dashboard Deployment

1. Create a GitHub repository and upload this project.
2. In Vercel, choose `Add New Project`.
3. Import the GitHub repository.
4. Set Framework Preset to `Other`.
5. Leave Build Command empty.
6. Leave Output Directory empty.
7. Deploy.

## Domain

After deployment, add `firestonejo.com` in Vercel under Project Settings > Domains.
Vercel will show the exact DNS records to add where the domain is managed.

Common setup:

- `www` as CNAME to Vercel's assigned target.
- Apex domain `firestonejo.com` using Vercel's recommended A record or nameservers.

Use the values shown inside Vercel as the source of truth.
