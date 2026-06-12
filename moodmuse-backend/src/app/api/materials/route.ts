import { NextRequest, NextResponse } from "next/server";
import { IS_DEMO, mockDetectMaterials } from "@/lib/demo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageBase64: string | undefined = body.imageBase64;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Missing imageBase64", details: "Send a base64-encoded image in the request body" },
        { status: 400 }
      );
    }

    if (IS_DEMO) {
      await new Promise((r) => setTimeout(r, 800));
      return NextResponse.json({ materials: mockDetectMaterials() });
    }

    const { detectMaterials } = await import("@/lib/claude");
    const materials = await detectMaterials(imageBase64);
    return NextResponse.json({ materials });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/materials", message);
    return NextResponse.json(
      { error: "Material detection failed", details: message },
      { status: 500 }
    );
  }
}
