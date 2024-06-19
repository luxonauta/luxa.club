import "./globals.scss";
import localFont from "next/font/local";

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
        <main>{children}</main>
      </div>
    </body>
  </html>
);

export default RootLayout;
