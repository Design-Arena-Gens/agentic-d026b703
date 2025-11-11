import { NextResponse } from "next/server";
import { fetchVeoOperation } from "@/lib/veo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const operationName = url.searchParams.get("operation");

    if (!operationName) {
      return NextResponse.json({ error: "operation query parameter is required" }, { status: 400 });
    }

    const result = await fetchVeoOperation(operationName);

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
    console.error("Veo operation check failed", error);
    return NextResponse.json({ error: (error as Error).message ?? "Unknown error" }, { status: 500 });
  }
}
