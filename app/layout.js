import "./globals.css";
import { Noto_Sans_Ethiopic } from "next/font/google";

import { Providers } from "./providers";

const notoSansEthiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata = {
  title: "ፊደል ቻት",
  description: "User-facing web interface for the Fidel conversational application stack.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="am" suppressHydrationWarning>
      <body className={`${notoSansEthiopic.className} h-[100dvh] min-h-screen overflow-hidden`}>
        <link rel="icon" type="image/png" href="/fidel-logo.png" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
