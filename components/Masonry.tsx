"use client";

import { gsap } from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import "./Masonry.css";

// Types
export interface MasonryItem {
  id: string;
  img: string;
  url: string;
  height: number;
  width?: number;
}

interface GridItem extends MasonryItem {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Size {
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
}

type AnimateFrom = "top" | "bottom" | "left" | "right" | "center" | "random";

interface MasonryProps {
  items: MasonryItem[];
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: AnimateFrom;
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
  colorShiftOnHover?: boolean;
}

const useMedia = (
  queries: string[],
  values: number[],
  defaultValue: number,
): number => {
  const get = (): number => {
    if (typeof window === "undefined") return defaultValue;
    return (
      values[queries.findIndex((q) => matchMedia(q).matches)] ?? defaultValue
    );
  };

  const [value, setValue] = useState<number>(get);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => setValue(get);
    queries.forEach((q) => matchMedia(q).addEventListener("change", handler));
    return () =>
      queries.forEach((q) =>
        matchMedia(q).removeEventListener("change", handler),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries]);

  return value;
};

const useMeasure = (): [React.RefObject<HTMLDivElement>, Size] => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
};

const preloadImages = async (urls: string[]): Promise<void> => {
  await Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = img.onerror = () => resolve();
        }),
    ),
  );
};

const Masonry: React.FC<MasonryProps> = ({
  items,
  ease = "power3.out",
  duration = 0.6,
  stagger = 0.05,
  animateFrom = "bottom",
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  colorShiftOnHover = false,
}) => {
  const columns = useMedia(
    [
      "(min-width:1500px)",
      "(min-width:1000px)",
      "(min-width:600px)",
      "(min-width:400px)",
    ],
    [5, 4, 3, 2],
    1,
  );

  const [containerRef, { width }] = useMeasure();
  const [imagesReady, setImagesReady] = useState(false);

  const getInitialPosition = (item: GridItem): Position => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: item.x, y: item.y };

    let direction: AnimateFrom = animateFrom;

    if (animateFrom === "random") {
      const directions: AnimateFrom[] = ["top", "bottom", "left", "right"];
      direction = directions[Math.floor(Math.random() * directions.length)];
    }

    switch (direction) {
      case "top":
        return { x: item.x, y: -200 };
      case "bottom":
        return { x: item.x, y: window.innerHeight + 200 };
      case "left":
        return { x: -200, y: item.y };
      case "right":
        return { x: window.innerWidth + 200, y: item.y };
      case "center":
        return {
          x: containerRect.width / 2 - item.w / 2,
          y: containerRect.height / 2 - item.h / 2,
        };
      default:
        return { x: item.x, y: item.y + 100 };
    }
  };

  useEffect(() => {
    preloadImages(items.map((i) => i.img)).then(() => setImagesReady(true));
  }, [items]);

  const grid = useMemo((): GridItem[] => {
    if (!width) return [];

    const colHeights = new Array(columns).fill(0);
    const columnWidth = width / columns;

    return items.map((child): GridItem => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = columnWidth * col;
      const height = child.height / 2;
      const y = colHeights[col];

      colHeights[col] += height;

      return { ...child, x, y, w: columnWidth, h: height };
    });
  }, [columns, items, width]);

  const hasMounted = useRef(false);

  useLayoutEffect(() => {
    if (!imagesReady) return;

    grid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`;
      const animationProps = {
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h,
      };

      if (!hasMounted.current) {
        const initialPos = getInitialPosition(item);
        const initialState = {
          opacity: 0,
          x: initialPos.x,
          y: initialPos.y,
          width: item.w,
          height: item.h,
          ...(blurToFocus && { filter: "blur(10px)" }),
        };

        gsap.fromTo(selector, initialState, {
          opacity: 1,
          ...animationProps,
          ...(blurToFocus && { filter: "blur(0px)" }),
          duration: 0.8,
          ease: "power3.out",
          delay: index * stagger,
        });
      } else {
        gsap.to(selector, {
          ...animationProps,
          duration: duration,
          ease: ease,
          overwrite: "auto",
        });
      }
    });

    hasMounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, imagesReady, stagger, animateFrom, blurToFocus, duration, ease]);

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: GridItem,
  ): void => {
    const element = e.currentTarget;
    const selector = `[data-key="${item.id}"]`;

    if (scaleOnHover) {
      gsap.to(selector, {
        scale: hoverScale,
        duration: 0.3,
        ease: "power2.out",
      });
    }

    if (colorShiftOnHover) {
      const imgElement = element.querySelector(".item-img");
      if (imgElement) {
        gsap.to(imgElement, {
          filter: "grayscale(0%)",
          duration: 0.3,
          ease: "power2.out",
        });
      }
    }
  };

  const handleMouseLeave = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: GridItem,
  ): void => {
    const element = e.currentTarget;
    const selector = `[data-key="${item.id}"]`;

    if (scaleOnHover) {
      gsap.to(selector, { scale: 1, duration: 0.3, ease: "power2.out" });
    }

    if (colorShiftOnHover) {
      const imgElement = element.querySelector(".item-img");
      if (imgElement) {
        gsap.to(imgElement, {
          filter: "grayscale(100%)",
          duration: 0.3,
          ease: "power2.out",
        });
      }
    }
  };

  return (
    <div ref={containerRef} className="list">
      {grid.map((item) => (
        <Link
          href={item.url}
          key={item.id}
          data-key={item.id}
          className="item-wrapper"
          onMouseEnter={(e) => handleMouseEnter(e, item)}
          onMouseLeave={(e) => handleMouseLeave(e, item)}
        >
          <div
            className="item-img"
            style={{
              backgroundImage: `url(${item.img})`,
              filter: colorShiftOnHover ? "grayscale(100%)" : "none",
            }}
          ></div>
        </Link>
      ))}
    </div>
  );
};

export default Masonry;
