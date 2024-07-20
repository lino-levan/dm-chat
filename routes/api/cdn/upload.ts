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
  async PUT(req) {
    const id = ulid();
    const command = new PutObjectCommand({
      Bucket: Deno.env.get("AWS_BUCKET")!,
      Key: id,
      Body: await req.arrayBuffer(),
    });
    const response = await client.send(command);
    return new Response(
      `https://${Deno.env.get("AWS_BUCKET")!}.s3.${Deno.env.get(
        "AWS_REGION",
      )!}.amazonaws.com/${id}`,
    );
  },
};
