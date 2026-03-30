import { useEffect, useState } from "react";

interface ProfileAvatarProps {
  alt: string;
  initials: string;
  size?: "default" | "small" | "large";
  src?: string | null;
}

export function ProfileAvatar({
  alt,
  initials,
  size = "default",
  src,
}: ProfileAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const className =
    size === "small"
      ? "profile-avatar small"
      : size === "large"
        ? "profile-avatar large"
        : "profile-avatar";

  return (
    <div className={className}>
      {src && !imageFailed ? (
        <img alt={alt} onError={() => setImageFailed(true)} src={src} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
