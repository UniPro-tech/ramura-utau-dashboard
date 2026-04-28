import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, filename, data } = body as {
      mode: string;
      filename: string;
      data: unknown;
    };

    // 1. バリデーションの強化
    if (!mode || !filename || data === undefined) {
      return NextResponse.json(
        { error: "mode, filename and data are required" },
        { status: 400 },
      );
    }

    // 2. パス構築の安全化
    // 設定ファイル専用のサブディレクトリ構造を定義
    const subPath = mode === "gesshoku" ? "gesshoku/files" : mode;
    const dir = path.join(
      process.cwd(),
      "public",
      "files",
      subPath,
      "settings",
    );
    const safeFilename = path.basename(filename).endsWith(".json")
      ? path.basename(filename)
      : `${path.basename(filename)}.json`;
    const filePath = path.join(dir, safeFilename);

    // 3. 非同期でのディレクトリ作成
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }

    // 4. 書き込み処理（非同期）
    const payload = {
      data,
      updatedAt: new Date().toISOString(), // 後で管理しやすいように更新日時を付与するのもアリ
    };

    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");

    return NextResponse.json({ ok: true, path: safeFilename });
  } catch (e) {
    console.error("[API_SETTINGS_SAVE_ERROR]:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
