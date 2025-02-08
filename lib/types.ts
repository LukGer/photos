export interface FullImage {
  name: string;
  fileId: string;
  embeddedMetadata: {
    ApertureValue: number;
    ISO: number;
    DateCreated: string;
    Make: string;
    Model: string;
    FNumber: number;
  };
  filePath: string;
  height: number;
  width: number;
  mime: "image/jpeg";
}
