/* eslint-disable no-unused-vars */
export interface ImageProps {
  height: string;
  width: string;
  public_id: string;
  asset_id: string;
  format: string;
  blurDataUrl?: string;
  caption?: string;
  cameraModel?: string;
  apertureValue?: string;
  exposureTime?: string;
  focalLength?: string;
  iso?: string;
}

export interface SharedModalProps {
  index: number;
  images?: ImageProps[];
  currentPhoto?: ImageProps;
  changePhotoId: (newVal: number) => void;
  closeModal: () => void;
  navigation: boolean;
  direction?: number;
}
