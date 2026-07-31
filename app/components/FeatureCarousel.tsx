"use client";

import { useEffect, useRef, useState } from "react";
import type { BoatGalleryItem } from "../data";

type FeatureCarouselProps = {
  boatName: string;
  items: BoatGalleryItem[];
};

export function FeatureCarousel({
  boatName,
  items,
}: FeatureCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [enlargedIndex, setEnlargedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (enlargedIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setEnlargedIndex(null);
      } else if (event.key === "ArrowLeft") {
        setEnlargedIndex((current) =>
          current === null ? null : Math.max(0, current - 1),
        );
      } else if (event.key === "ArrowRight") {
        setEnlargedIndex((current) =>
          current === null ? null : Math.min(items.length - 1, current + 1),
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enlargedIndex, items.length]);

  function goTo(index: number) {
    const nextIndex = Math.max(0, Math.min(index, items.length - 1));
    const track = trackRef.current;
    const slide = track?.children.item(nextIndex) as HTMLElement | null;

    if (track && slide) {
      track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
      setActiveIndex(nextIndex);
    }
  }

  function updateActiveSlide() {
    const track = trackRef.current;
    if (!track) return;

    const slides = Array.from(track.children) as HTMLElement[];
    const closest = slides.reduce(
      (best, slide, index) => {
        const distance = Math.abs(slide.offsetLeft - track.scrollLeft);
        return distance < best.distance ? { index, distance } : best;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY },
    );

    setActiveIndex(closest.index);
  }

  return (
    <section
      className="feature-carousel"
      aria-labelledby={`${boatName.toLowerCase().replaceAll(" ", "-")}-gallery-title`}
    >
      <div className="feature-carousel-heading">
        <div>
          <span className="eyebrow">Explore the details</span>
          <h2
            id={`${boatName.toLowerCase().replaceAll(" ", "-")}-gallery-title`}
          >
            Designed around life on the water.
          </h2>
        </div>
        <div className="feature-carousel-controls">
          <span aria-live="polite">
            {String(activeIndex + 1).padStart(2, "0")} /{" "}
            {String(items.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous feature"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === items.length - 1}
            aria-label="Next feature"
          >
            →
          </button>
        </div>
      </div>

      <div
        className="feature-carousel-track"
        ref={trackRef}
        onScroll={updateActiveSlide}
        tabIndex={0}
        aria-label={`${boatName} feature photographs`}
      >
        {items.map((item, index) => (
          <article className="feature-carousel-slide" key={item.image}>
            <button
              className="feature-carousel-image"
              type="button"
              onClick={() => setEnlargedIndex(index)}
              aria-label={`View larger image: ${item.title}`}
            >
              <img
                src={item.image}
                alt={item.alt}
                loading="lazy"
              />
              <span className="feature-carousel-enlarge">View larger</span>
            </button>
            <div className="feature-carousel-caption">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="feature-carousel-swipe">Swipe to explore</p>

      {enlargedIndex !== null && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${boatName} enlarged photograph`}
          onClick={(event) => {
            if (event.currentTarget === event.target) {
              setEnlargedIndex(null);
            }
          }}
        >
          <button
            className="gallery-lightbox-close"
            type="button"
            onClick={() => setEnlargedIndex(null)}
            aria-label="Close enlarged image"
            autoFocus
          >
            ×
          </button>
          <div className="gallery-lightbox-content">
            <img
              src={items[enlargedIndex].image}
              alt={items[enlargedIndex].alt}
            />
            <div className="gallery-lightbox-caption">
              <span>
                {String(enlargedIndex + 1).padStart(2, "0")} /{" "}
                {String(items.length).padStart(2, "0")}
              </span>
              <strong>{items[enlargedIndex].title}</strong>
            </div>
          </div>
          <button
            className="gallery-lightbox-arrow gallery-lightbox-arrow--previous"
            type="button"
            onClick={() =>
              setEnlargedIndex((current) =>
                current === null ? null : Math.max(0, current - 1),
              )
            }
            disabled={enlargedIndex === 0}
            aria-label="Previous enlarged image"
          >
            ←
          </button>
          <button
            className="gallery-lightbox-arrow gallery-lightbox-arrow--next"
            type="button"
            onClick={() =>
              setEnlargedIndex((current) =>
                current === null
                  ? null
                  : Math.min(items.length - 1, current + 1),
              )
            }
            disabled={enlargedIndex === items.length - 1}
            aria-label="Next enlarged image"
          >
            →
          </button>
        </div>
      )}
    </section>
  );
}
