"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { HomepageContent } from "@/server/site-content/homepage";

type DemoVideo = HomepageContent["demoVideos"][number];

function getYoutubeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    let videoId = "";
    if (host === "youtu.be") videoId = url.pathname.slice(1);
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") videoId = url.searchParams.get("v") ?? "";
      if (/^\/(embed|shorts)\//.test(url.pathname)) videoId = url.pathname.split("/")[2] ?? "";
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`
      : "";
  } catch {
    return "";
  }
}

export function DemoVideoGallery({ videos }: { videos: DemoVideo[] }) {
  const [activeVideo, setActiveVideo] = useState<DemoVideo | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (activeVideo && !element.open) element.showModal();
    if (!activeVideo && element.open) element.close();
  }, [activeVideo]);

  function renderPlayer(video: DemoVideo) {
    const youtubeUrl = getYoutubeEmbedUrl(video.videoUrl);
    if (youtubeUrl) {
      return <iframe src={youtubeUrl} title={video.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />;
    }
    return <video src={video.videoUrl} controls autoPlay preload="metadata" aria-label={video.title} />;
  }

  return (
    <>
      <div className="demo-video-grid">
        {videos.map((video) => (
          <article className="demo-video-card" key={`${video.title}-${video.videoUrl}`}>
            <button className="demo-video-poster" type="button" onClick={() => setActiveVideo(video)} aria-label={`Play ${video.title}`}>
              {video.thumbnailUrl
                ? <Image src={video.thumbnailUrl} alt={video.altText || `${video.title} preview`} fill sizes="(max-width: 700px) 90vw, 33vw" unoptimized />
                : <span className="demo-video-empty">SmartNum class preview</span>}
              <span className="demo-video-play" aria-hidden="true">▶</span>
            </button>
            <div className="demo-video-caption"><span>{video.subject} · {video.classLabel}</span><h3>{video.title}</h3></div>
          </article>
        ))}
        {videos.length === 0 && <p className="cms-empty-note">Class previews will appear here when SmartNum adds approved videos in Site Content.</p>}
      </div>

      <dialog className="demo-video-dialog" ref={dialog} onClose={() => setActiveVideo(null)} onCancel={() => setActiveVideo(null)} onClick={(event) => { if (event.target === event.currentTarget) setActiveVideo(null); }}>
        {activeVideo && <div className="demo-video-dialog-content"><div className="demo-video-dialog-head"><strong>{activeVideo.title}</strong><button type="button" className="demo-video-close" onClick={() => setActiveVideo(null)} aria-label="Close video">Close</button></div><div className="demo-video-player">{renderPlayer(activeVideo)}</div></div>}
      </dialog>
    </>
  );
}