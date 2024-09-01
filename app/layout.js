import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Rate My Professor RAG",
  description: "Uses OpenAI and Pinecone",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
          <link rel="icon" href="/logo.png" sizes="32x32" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
