import { Handlers } from "$fresh/server.ts";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ulid } from "$std/ulid/mod.ts";

const client = new S3Client({
  credentials: {
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY")!,
    secretAccessKey: Deno.env.get("AWS_SECRET_KEY")!,
  },
  region: Deno.env.get("AWS_REGION")!,
});

export const handler: Handlers = {
  // Generate s3 signed url
  async GET() {
    const command = new PutObjectCommand({
      Bucket: Deno.env.get("AWS_BUCKET")!,
      Key: ulid(),
    });
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    return new Response(signedUrl);
  },
};
