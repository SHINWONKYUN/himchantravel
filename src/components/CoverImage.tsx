import { useState } from 'react'

export type PlaceholderVariant =
  | 'phu-quoc'
  | 'nha-trang'
  | 'hong-kong'
  | 'taiwan'
  | 'business'
  | 'default'

type Props = {
  src?: string
  alt: string
  placeholderVariant: PlaceholderVariant
  className?: string
  imgClassName?: string
}

export function CoverImage({
  src,
  alt,
  placeholderVariant,
  className = '',
  imgClassName = '',
}: Props) {
  const [failed, setFailed] = useState(false)
  const showImg = Boolean(src) && !failed

  return (
    <div
      className={`cover-image ${className}`.trim()}
      role={showImg ? undefined : 'img'}
      aria-label={showImg ? undefined : alt}
    >
      {showImg ? (
        <img
          className={imgClassName}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className={`cover-image__placeholder cover-image__placeholder--${placeholderVariant}`}
          aria-hidden={!showImg}
        />
      )}
    </div>
  )
}
