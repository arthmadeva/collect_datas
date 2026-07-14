import type { AppProps } from "next/app";
import { Outfit } from "next/font/google";
import "../app/globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${outfit.variable} font-sans min-h-screen bg-slate-950 text-slate-100 flex flex-col`}>
      <Component {...pageProps} />
    </div>
  );
}
