import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// モードに応じた保存先ディレクトリを計算するヘルパー
const getTargetDirectory = (mode: string) => {
  const subPath = mode === "gesshoku" ? "gesshoku/files" : mode;
  return path.join(process.cwd(), "public", "files", subPath);
};

// GET: ファイル一覧の取得
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "arane";
    const dir = getTargetDirectory(mode);

    if (!existsSync(dir)) return NextResponse.json([]);

    const fileNames = await fs.readdir(dir);

    // 並列でファイル情報を取得
    const rows = await Promise.all(
      fileNames.map(async (name) => {
        const stats = await fs.stat(path.join(dir, name));
        return {
          id: name,
          name: name,
          size: stats.size,
          createdAt: stats.birthtime.toLocaleString("ja-JP"),
          updatedAt: stats.mtime.toLocaleString("ja-JP"),
        };
      }),
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET Error:", err);
    return NextResponse.json(
      { error: "一覧の取得に失敗しました" },
      { status: 500 },
    );
  }
}

// POST: ファイルのアップロード
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "arane";
    const dir = getTargetDirectory(mode);

    // ディレクトリがなければ作成
    await fs.mkdir(dir, { recursive: true });

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    await Promise.all(
      files.map(async (file) => {
        const safeName = path.basename(file.name); // パストラバーサル対策
        const arrayBuffer = await file.arrayBuffer();
        await fs.writeFile(path.join(dir, safeName), Buffer.from(arrayBuffer));
      }),
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST Error:", err);
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 },
    );
  }
}

// DELETE: ファイルの削除
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "arane";
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "ファイル名が指定されていません" },
        { status: 400 },
      );
    }

    const dir = getTargetDirectory(mode);
    const filePath = path.join(dir, path.basename(filename));

    if (existsSync(filePath)) {
      await fs.unlink(filePath);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE Error:", err);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
