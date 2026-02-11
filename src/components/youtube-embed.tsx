"use client";

interface YouTubeEmbedProps {
  id: string;
  title: string;
}

export function YouTubeEmbed({ id, title }: YouTubeEmbedProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 transition-colors hover:border-neutral-700">
      <div className="relative aspect-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <div className="px-4 py-3">
        <p className="text-[13px] font-medium text-neutral-200 line-clamp-2">
          {title}
        </p>
      </div>
    </div>
  );
}
