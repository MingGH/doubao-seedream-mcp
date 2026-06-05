export interface Env {
  ARK_API_KEY?: string;
  ARK_MODEL?: string;
}

export interface ImageGenerationRequest {
  model: string;
  prompt: string;
  image?: string | string[];
  size?: string;
  sequential_image_generation?: "auto" | "disabled";
  sequential_image_generation_options?: {
    max_images?: number;
  };
  tools?: Array<{ type: "web_search" }>;
  stream?: boolean;
  guidance_scale?: number;
  output_format?: "png" | "jpeg";
  response_format?: "url" | "b64_json";
  watermark?: boolean;
  optimize_prompt_options?: {
    mode?: "standard" | "fast";
  };
}

export interface ImageData {
  url?: string;
  b64_json?: string;
  size?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface ImageGenerationResponse {
  model: string;
  created: number;
  data: ImageData[];
  tools?: Array<{ type: string }>;
  usage?: {
    generated_images: number;
    output_tokens: number;
    total_tokens: number;
    tool_usage?: {
      web_search: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}
