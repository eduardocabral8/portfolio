import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "../../i18n";
import { archivo, asap, geistMono } from "../fonts";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";
import { Terminal } from "@/components/shell/Terminal";
import { siteUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isEs = params.locale === "es";
  const desc = isEs
    ? "Full Stack Developer con experiencia en producción y foco en arquitectura sostenible."
    : "Full Stack Developer with production experience and a focus on sustainable architecture.";
  return {
    title: "Emanuel Cabral · Full Stack Developer",
    description: desc,
    metadataBase: new URL(siteUrl),
    openGraph: {
      title: "Emanuel Cabral — Full Stack Developer",
      description: desc,
      url: `${siteUrl}/${params.locale}`,
      siteName: "Emanuel Cabral Portfolio",
      locale: isEs ? "es_AR" : "en_US",
      type: "website",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: "Emanuel Cabral — Full Stack Developer",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Emanuel Cabral — Full Stack Developer",
      description: desc,
      images: ["/og.png"],
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${archivo.variable} ${asap.variable} ${geistMono.variable}`}>
      <body id="top" style={{ paddingTop: "var(--header-h)" }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Emanuel Cabral",
              jobTitle: "Full Stack Developer",
              url: siteUrl,
              sameAs: [
                "https://github.com/eduardoemanuelcf",
                "https://www.linkedin.com/in/eduardoemanuelcf"
              ]
            })
          }}
        />
        <NextIntlClientProvider messages={messages}>
          <SiteHeader />
          {children}
          <Footer />
          <Terminal />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
