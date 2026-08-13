import { NextResponse } from "next/server";
import "@/lib/ensureSeeded";

export async function GET() {
  return NextResponse.json({ status: "ok", module: "nuspa-lead-yonetimi" });
}
