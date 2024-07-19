import Script from "next/script";
import localFont from "next/font/local";
import "./globals.scss";
import { Toaster } from "react-hot-toast";

const inter = localFont({
  display: "swap",
  preload: true,
  src: "../../public/fonts/inter/inter.ttf",
  variable: "--font-inter",
  weight: "400 700"
});

export const metadata = {
  title: "Luxa Club!",
  description:
    "Welcome to Luxa's exploration labs! If you're here, you're part of the club. 🧩"
};

const RootLayout = ({ children }) => (
  <html lang="en" className={`${inter.variable}`}>
    <body>
      <div className="container">
        <Toaster />
        <main>{children}</main>
      </div>
      <Script
        defer
        data-domain="luxa.club"
        src="https://plausible.io/js/script.js"
      />
    </body>
  </html>
);

export default RootLayout;
