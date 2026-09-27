import type { Metadata } from 'next';

import './globals.css';



export const metadata: Metadata = {
  title: { default: 'Knowledge AI — Your docs. Better answers.', template: '%s · Knowledge AI' },
  description:
    'Turn company documents into a helpful website assistant. Upload your knowledge, test the answers, and embed a chatbot on your site.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
