import { NextResponse } from "next/server";
import { createVeoVideo, type VeoGenerationPayload } from "@/lib/veo";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<VeoGenerationPayload> & { storyboard?: unknown };

    if (!body.prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const payload: VeoGenerationPayload = {
      prompt: body.prompt,
      durationSeconds: Number(body.durationSeconds ?? 12),
      aspectRatio: body.aspectRatio ?? "16:9",
      cameraStyle: body.cameraStyle ?? "cinematic-dolly",
      visualStyle: body.visualStyle ?? "hollywood-epic",
      fps: Number(body.fps ?? 24),
      storyboard: body.storyboard as VeoGenerationPayload["storyboard"],
      referenceImageBase64: body.referenceImageBase64
    };

    const result = await createVeoVideo(payload);

    return NextResponse.json(
      {
        operationName: result.operationName,
        done: result.done,
        videoUris: result.videoUris,
        throttleSeconds: result.throttleSeconds
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Veo generation error", error);
    return NextResponse.json({ error: (error as Error).message ?? "Unknown error" }, { status: 500 });
  }
}
