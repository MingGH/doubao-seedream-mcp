import { ImageGenerationRequest, ImageGenerationResponse } from "./types";

const ARK_API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";

export async function generateImage(
  apiKey: string,
  params: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  const res = await fetch(ARK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ark API error (${res.status}): ${err}`);
  }

  return res.json() as Promise<ImageGenerationResponse>;
}
