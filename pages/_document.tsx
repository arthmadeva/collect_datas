import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="id" className="h-full">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Integrasi Spreadsheet 'Collect Data' Akur Optic 55" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="h-full bg-slate-950 text-slate-100 antialiased selection:bg-teal-500/30 selection:text-teal-200">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
