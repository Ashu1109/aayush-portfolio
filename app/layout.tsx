import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource/ibm-plex-mono/400.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aayush Kumar — Full Stack AI Engineer',
  description: 'From interface to infrastructure. Explore Aayush Kumar’s work building production AI platforms, multi-agent systems, and thoughtful web experiences.',
  applicationName: 'Aayush Kumar Portfolio',
  keywords: ['Aayush Kumar', 'Full Stack AI Engineer', 'Next.js', 'multi-agent systems', 'LoglineAI', 'portfolio'],
  openGraph: {title: 'Aayush Kumar — Full Stack AI Engineer', description: 'Full-stack products, production AI systems, and the engineering behind the experience.', type: 'website', locale: 'en_IN'},
  twitter: {card: 'summary', title: 'Aayush Kumar — Full Stack AI Engineer', description: 'Full-stack products, production AI systems, and the engineering behind the experience.'},
  robots: {index: true, follow: true},
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
