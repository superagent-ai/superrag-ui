"use client";

import { useState } from "react";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadingStatus, setUploadingStatus] = useState<
    "superrag" | "s3" | "none" | "done"
  >("none");

  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const uploadToSuperRag = async (url: string) => {
    setUploadingStatus("superrag");

    const res = await fetch(window.location.origin + "/api/ingest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: [
          {
            url: url,
          },
        ],
      }),
    });
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    setUploadingStatus("s3");

    const response = await fetch(window.location.origin + "/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });

    if (response.ok) {
      const { presignedUrl, url, fields } = await response.json();
      setUploadedFileUrl(url);

      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append("file", file);

      const uploadResponse = await fetch(presignedUrl, {
        method: "POST",
        body: formData,
      });

      if (uploadResponse.ok) {
        await uploadToSuperRag(url);
        alert("Upload successful!");
      } else {
        console.error("S3 Upload Error:", uploadResponse);
        alert("Upload failed.");
      }
    } else {
      alert("Failed to get pre-signed URL.");
    }

    setUploadingStatus("done");
  };

  return (
    <main>
      <h1>Upload a File to S3</h1>
      <form onSubmit={handleSubmit}>
        <input
          id="file"
          type="file"
          onChange={(e) => {
            const files = e.target.files;
            if (files) {
              setFile(files[0]);
            }
          }}
          accept=".pdf,.docx,.doc"
        />
        <button type="submit" disabled={uploadingStatus !== "none"}>
          Upload
        </button>

        {uploadingStatus === "s3" && (
          <p>Uploading {uploadedFileUrl} to S3...</p>
        )}
        {uploadingStatus === "superrag" && <p>Uploading to SuperRag...</p>}
        {uploadingStatus === "done" && <p>Ingestion is completed!</p>}
      </form>
    </main>
  );
}
