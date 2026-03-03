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

## CORS対策（画像エクスポート）

ブラウザだけで CORS を「突破」はできないため、画像エクスポート時に外部画像を使うには CORS 許可付きの画像プロキシを使います。

- `NEXT_PUBLIC_IMAGE_PROXY=https://your-proxy.example.com/?url=`

この環境変数を設定すると、画像URLは自動で `proxy + encodeURIComponent(originalUrl)` 形式で読み込まれます。
GitHub Pages の Actions ビルドでは、Repository Variables に `NEXT_PUBLIC_IMAGE_PROXY` を作成してください（`Settings > Secrets and variables > Actions > Variables`）。

Cloudflare Workers 例:

```js
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target) return new Response('missing url', { status: 400 });

    const targetUrl = new URL(target);
    // 必要に応じて許可ドメインを制限
    // if (!['cdn.myanimelist.net'].includes(targetUrl.hostname)) return new Response('blocked', { status: 403 });

    const upstream = await fetch(targetUrl.toString(), {
      headers: { 'User-Agent': '9-animes-image-proxy' }
    });

    const headers = new Headers(upstream.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=86400');
    return new Response(upstream.body, { status: upstream.status, headers });
  }
};
```
