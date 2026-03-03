import type { NextConfig } from 'next';

const explicitBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const isGithubPages = process.env.GITHUB_ACTIONS === 'true';
const repoName = process.env.GITHUB_PAGES_REPO || '';
const autoBasePath = isGithubPages && repoName ? `/${repoName}` : '';
const basePath = explicitBasePath || autoBasePath;

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
