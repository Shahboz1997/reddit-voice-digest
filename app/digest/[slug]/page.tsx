import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { DigestPageClient } from "@/components/digest-page-client";
import { hasSupabaseBrowserEnv, publicEnv } from "@/lib/config";
import { getPublishedDigestBySlug } from "@/lib/data/digests";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface DigestPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    t?: string;
  }>;
}

function digestPageUrl(slug: string) {
  return `${publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/digest/${slug}`;
}

function serializeJsonLd(payload: object) {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

async function resolveViewerUserId() {
  if (!hasSupabaseBrowserEnv()) {
    return null;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
  } catch {
    return null;
  }
}

const loadDigestEpisode = cache(async (slug: string, viewerUserId: string | null) => {
  return getPublishedDigestBySlug(slug, viewerUserId);
});

export async function generateMetadata({ params }: DigestPageProps): Promise<Metadata> {
  const { slug } = await params;
  const viewerUserId = await resolveViewerUserId();
  const episode = await loadDigestEpisode(slug, viewerUserId);

  if (!episode) {
    return {
      title: "Digest not found",
    };
  }

  const pageUrl = digestPageUrl(slug);
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
  const viewerUserId = await resolveViewerUserId();
  const episode = await loadDigestEpisode(slug, viewerUserId);

  if (!episode) {
    notFound();
  }

  const initialSeekSeconds = (() => {
    const parsed = t ? Number.parseInt(t, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  })();

  const pageUrl = digestPageUrl(slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episode.title,
    description: episode.introText || episode.summary,
    datePublished: episode.publishedAt,
    url: pageUrl,
    duration: `PT${Math.max(1, episode.durationSeconds)}S`,
    ...(episode.audioUrl
      ? {
          associatedMedia: {
            "@type": "MediaObject",
            contentUrl: episode.audioUrl,
          },
        }
      : {}),
    partOfSeries: {
      "@type": "PodcastSeries",
      name: "Reddit Voice Digest",
      url: publicEnv.NEXT_PUBLIC_APP_URL,
    },
  };

  return (
    <main className="min-h-screen">
      <h1 className="sr-only">{episode.title}</h1>
      <script
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        type="application/ld+json"
      />
      <DigestPageClient
        episode={episode}
        initialSeekSeconds={initialSeekSeconds}
        rssUrl={`${publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/podcast/feed`}
      />
    </main>
  );
}
