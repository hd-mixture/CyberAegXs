import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'CyberAegXs | Secure PDF Scanner & AI Editor',
  description: 'Cyber-secure document scanning, AI-powered summarization, and precision PDF editing.',
  icons: {
    icon: '/favicon.png?v=4',
    shortcut: '/favicon.png?v=4',
    apple: '/favicon.png?v=4',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Aggressive cache busting for the favicon */}
        <link rel="icon" href="/favicon.png?v=4" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png?v=4" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-accent/30 selection:text-accent-foreground">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
