import React, { useEffect, useRef } from "react";

export default function VideoFeed({
  stream,
  muted = false,
  className = "",
}: {
  stream?: MediaStream;
  muted?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!videoRef.current) return;
    if (stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.srcObject = null;
    }
  }, [stream]);
  return (
    <video
      ref={videoRef}
      muted={muted}
      autoPlay
      playsInline
      className={className}
    />
  );
}
