"use client";

import { IKImage } from "imagekitio-next";

export default function ImagePage({ imageName }: { imageName: string }) {
  return (
    <main>
      <h1>Image Page</h1>

      <IKImage
        urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
        path={imageName}
        alt={imageName}
        loading="lazy"
      />
    </main>
  );
}
