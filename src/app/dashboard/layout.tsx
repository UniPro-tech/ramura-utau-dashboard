import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import Drawer from "@/components/drawer";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`antialiased`}>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <Drawer>{children}</Drawer>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
