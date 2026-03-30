import { useEffect, useState } from "react";

interface ProfileAvatarProps {
  alt: string;
  fallbackSrcs?: string[];
  initials: string;
  size?: "default" | "small" | "large";
}

export function ProfileAvatar({
  alt,
  fallbackSrcs = [],
  initials,
  size = "default",
}: ProfileAvatarProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fallbackKey = fallbackSrcs.join("|");

  useEffect(() => {
    setCurrentIndex(0);
  }, [fallbackKey]);

  const className =
    size === "small"
      ? "profile-avatar small"
      : size === "large"
        ? "profile-avatar large"
        : "profile-avatar";
  const activeSrc = fallbackSrcs[currentIndex];

  return (
    <div className={className}>
      {activeSrc ? (
        <img alt={alt} onError={() => setCurrentIndex((index) => index + 1)} src={activeSrc} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
