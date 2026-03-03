import type { NextConfig } from 'next';

const isGithubPages = process.env.GITHUB_ACTIONS === 'true';
const repoName = process.env.GITHUB_PAGES_REPO || '';
const basePath = isGithubPages && repoName ? `/${repoName}` : '';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true
};

export default nextConfig;
