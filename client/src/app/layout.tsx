import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
    title: "Vybe",
    description: "Vybe To your Music",
    keywords:
        "Vybe, music, songs, playlists, youtube-music, spotify, ad-free music",
    authors: [{ name: "Avadhoot Smart", url: "https://vybe.avadhootsmart.xyz" }],
    metadataBase: new URL("https://vybe.avadhootsmart.xyz"),
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="robots" content="index, follow" />
                <meta charSet="UTF-8" />
                <link
                    rel="apple-touch-icon"
                    sizes="180x180"
                    href="/apple-touch-icon.png"
                />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="32x32"
                    href="/favicon-32x32.png"
                />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="16x16"
                    href="/favicon-16x16.png"
                />
            </head>
            <body className={`antialiased`}>
                <main>{children}</main>
                <Toaster />
            </body>
        </html>
    );
}
