import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/api/uploadthing-node";

export type OurFileRouter = {
  imageUploader: {
    config: {
      maxFileSize: "128MB";
      maxFileCount: 4;
    };
    input: never;
    output: {
      url: string;
    }[];
  };
  documentUploader: {
    config: {
      maxFileSize: "32MB";
      maxFileCount: 1;
    };
    input: {
      pdf: never;
      doc: never;
      docx: never;
    };
    output: {
      url: string;
    }[];
  };
};

// This is only needed for type safety when using UploadButton/UploadDropzone
declare module "@uploadthing/react" {
  interface FileRouterRecord {
    imageUploader: OurFileRouter["imageUploader"];
    documentUploader: OurFileRouter["documentUploader"];
  }
}

const f = createUploadthing();

export const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: "128MB", maxFileCount: 4 } })
    .middleware(async () => {
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
  documentUploader: f({ 
    pdf: { maxFileSize: "32MB", maxFileCount: 1 },
    doc: { maxFileSize: "32MB", maxFileCount: 1 },
    docx: { maxFileSize: "32MB", maxFileCount: 1 }
  })
    .middleware(async () => {
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;