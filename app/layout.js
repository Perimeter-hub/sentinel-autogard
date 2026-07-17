import "./globals.css";

export const metadata = {
  title: "Sentinel Autogard",
  description: "AI-driven market, project, tender and site intelligence platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
