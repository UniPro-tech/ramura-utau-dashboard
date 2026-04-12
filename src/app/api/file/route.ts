import fs from "node:fs";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") || "arane";
    const filename = url.searchParams.get("filename");
    if (!filename)
      return NextResponse.json({ error: "filename required" }, { status: 400 });

    const filePath = `./public/files/${mode}${
      mode === "gesshoku" ? "/files" : ""
    }/${filename}`;
    if (!fs.existsSync(filePath))
      return NextResponse.json({ error: "not found" }, { status: 404 });

    const stat = fs.statSync(filePath);
    return NextResponse.json({
      id: filename,
      name: filename,
      size: stat.size,
      createdAt: new Date(stat.birthtime).toLocaleString("ja-JP"),
      updatedAt: new Date(stat.mtime).toLocaleString("ja-JP"),
    });
  } catch (e) {
    console.error("/api/file error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") || "arane";
    const filename = url.searchParams.get("filename");
    if (!filename)
      return NextResponse.json({ error: "filename required" }, { status: 400 });

    const filePath = `./public/files/${mode}${
      mode === "gesshoku" ? "/files" : ""
    }/${filename}`;
    if (!fs.existsSync(filePath))
      return NextResponse.json({ error: "not found" }, { status: 404 });

    await fs.promises.unlink(filePath);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("/api/file DELETE error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
