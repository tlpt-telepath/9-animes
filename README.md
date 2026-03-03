# 私を構成する9つのアニメ (MVP)

Next.js + TypeScript + Tailwind で作る、GitHub Pages 向け静的Webアプリです。

## Local Development

```bash
npm install
npm run dev
```

## Static Build

```bash
npm run build
```

`out/` が生成されます。

## GitHub Pages Build Env Example

- `GITHUB_ACTIONS=true`
- `GITHUB_PAGES_REPO=9-animes`

この2つを設定すると `basePath` と `assetPrefix` が `/9-animes` になります。

任意で `NEXT_PUBLIC_BASE_PATH=/your-repo-name` を指定すると、ローカルビルドでも同じ `basePath` を強制できます。
