import fs from "node:fs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, filename, data } = body as {
      mode: string;
      filename: string;
      data: unknown;
    };
    if (!mode || !filename || !data) {
      return NextResponse.json(
        { error: "mode, filename and data required" },
        { status: 400 },
      );
    }

    const dir = `./public/files/${mode}/settings`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = `${dir}/${filename}`;
    const payload = { data };
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(payload, null, 2),
      "utf-8",
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("/api/settings/save error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
