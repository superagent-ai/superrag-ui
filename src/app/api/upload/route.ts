import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { S3Client } from "@aws-sdk/client-s3";

export async function POST(request: Request) {
  const { filename, contentType } = await request.json();

  try {
    const client = new S3Client({ region: process.env.AWS_REGION });
    const key =
      crypto.randomUUID() + "-" + filename.replace(/[^a-z0-9.]/gi, "_");

    const { url: presignedUrl, fields } = await createPresignedPost(client, {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Conditions: [
        ["content-length-range", 0, 10485760], // up to 10 MB
        ["starts-with", "$Content-Type", contentType],
      ],
      Fields: {
        acl: "public-read",
        "Content-Type": contentType,
      },
      Expires: 600, // Seconds before the presigned post expires. 3600 by default.
    });

    return Response.json({
      presignedUrl,
      url: `${presignedUrl}${key}`,
      fields,
    });
  } catch (error: any) {
    return Response.json({ error: error.message });
  }
}
