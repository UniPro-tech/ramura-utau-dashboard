import fs from "node:fs";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") || "arane";
    const dir = `./public/files/${mode}${mode === "gesshoku" ? "/files" : ""}`;

    if (!fs.existsSync(dir)) {
      return NextResponse.json([]);
    }

    const files = await fs.promises.readdir(dir);

    const rows = files.map((file) => ({
      id: file,
      name: file,
      size: fs.statSync(`${dir}/${file}`).size,
      createdAt: new Date(
        fs.statSync(`${dir}/${file}`).birthtime,
      ).toLocaleString("ja-JP"),
      updatedAt: new Date(fs.statSync(`${dir}/${file}`).mtime).toLocaleString(
        "ja-JP",
      ),
    }));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("/api/files error", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") || "arane";
    const dir = `./public/files/${mode}${mode === "gesshoku" ? "/files" : ""}`;

    // Ensure directory exists
    await fs.promises.mkdir(dir, { recursive: true });

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "content-type must be multipart/form-data" },
        { status: 400 },
      );
    }

    // In Next.js route handlers running on Node, Request is a web Fetch API Request.
    // Use formData() to parse multipart body.
    const formData = await request.formData();
    const entries = Array.from(formData.getAll("files") as File[]);

    for (const f of entries) {
      const filename = f.name;
      const arrayBuffer = await f.arrayBuffer();
      await fs.promises.writeFile(
        `${dir}/${filename}`,
        Buffer.from(arrayBuffer),
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("/api/files POST error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
