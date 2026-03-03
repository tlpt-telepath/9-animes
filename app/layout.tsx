import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '私を構成する9つのアニメ',
  description: '9つのアニメ作品を選んで1枚画像として保存するMVP'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
