import { createUploadthing } from "uploadthing/server";

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
};

export type OurFileRouter = typeof uploadRouter; 