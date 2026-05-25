import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DigestPageClient } from "@/components/digest-page-client";
import { publicEnv } from "@/lib/config";
import { getPublishedDigestBySlug } from "@/lib/data/digests";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface DigestPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    t?: string;
  }>;
}

export async function generateMetadata({ params }: DigestPageProps): Promise<Metadata> {
  const { slug } = await params;
  const episode = await getPublishedDigestBySlug(slug);

  if (!episode) {
    return {
      title: "Digest not found",
    };
  }

  const pageUrl = `${publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/digest/${slug}`;
  const description = episode.introText || episode.summary.slice(0, 160);

  return {
    title: episode.title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "article",
      url: pageUrl,
      title: episode.title,
      description,
      publishedTime: episode.publishedAt,
      tags: episode.topics,
    },
    twitter: {
      card: "summary_large_image",
      title: episode.title,
      description,
    },
  };
}

export default async function DigestPage({ params, searchParams }: DigestPageProps) {
  const { slug } = await params;
  const { t } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const episode = await getPublishedDigestBySlug(slug, user?.id ?? null);

  if (!episode) {
    notFound();
  }

  const initialSeekSeconds = (() => {
    const parsed = t ? Number.parseInt(t, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  })();

  const pageUrl = `${publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/digest/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episode.title,
    description: episode.introText || episode.summary,
    datePublished: episode.publishedAt,
    url: pageUrl,
    duration: `PT${Math.max(1, episode.durationSeconds)}S`,
    associatedMedia: episode.audioUrl
      ? {
          "@type": "MediaObject",
          contentUrl: episode.audioUrl,
        }
      : undefined,
    partOfSeries: {
      "@type": "PodcastSeries",
      name: "Reddit Voice Digest",
      url: publicEnv.NEXT_PUBLIC_APP_URL,
    },
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
      <DigestPageClient
        episode={episode}
        initialSeekSeconds={initialSeekSeconds}
        rssUrl={`${publicEnv.NEXT_PUBLIC_APP_URL}/api/podcast/feed`}
      />
    </>
  );
}
