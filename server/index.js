// server/index.js  (ESModule 版，Node≥18 可直接跑)
import { readdir, stat } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import cors from "cors";
import moment from "moment";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APK_DIR = path.resolve(__dirname, "../app"); // apk 所在目录
const PORT = 3001;

const app = express();
app.use(cors());

/* 1. 静态托管 + 强制下载 */
app.use(
  "/apk",
  express.static(APK_DIR, {
    setHeaders(res, filePath) {
      res.set(
        "Content-Disposition",
        `attachment; filename="${path.basename(filePath)}"`
      );
    },
  })
);

/* 2. 解析文件名 */
function parseApk(file) {
  const name = path.basename(file, path.extname(file));
  const m = name.match(/^V([\d.]+)-(.+)$/);
  if (!m) return null;
  const [, version, pkgName] = m;
  return { version, pkgName, fileName: path.basename(file) };
}

/* 3. 扫描目录并分组、标最新 */
async function scan() {
  const files = await readdir(APK_DIR);
  const list = (
    await Promise.all(
      files
        .filter((f) => f.endsWith(".apk"))
        .map(async (f) => {
          const full = path.join(APK_DIR, f);
          const st = await stat(full);
          const parsed = parseApk(f);
          if (!parsed) return null;
          return { ...parsed, fileName: f, mtime: st.mtime };
        })
    )
  ).filter(Boolean);

  const map = {};
  for (const it of list) {
    if (!map[it.pkgName]) map[it.pkgName] = [];
    map[it.pkgName].push(it);
  }
  // 每组按版本号降序
  for (const pkg in map) {
    map[pkg].sort((a, b) =>
      b.version.localeCompare(a.version, undefined, { numeric: true })
    );
  }
  return map;
}

/* 4. 列表接口 */
app.get("/api/apk", async (_req, res) => {
  try {
    const data = await scan();
    res.json({ code: 0, data });
  } catch (e) {
    res.status(500).json({ code: 1, msg: e.message });
  }
});

/* 5. 启动 */
app.listen(PORT, () => {
  console.log(`Server running:`);
  console.log(`  API     -> http://localhost:${PORT}/api/apk`);
  console.log(`  Static  -> http://localhost:${PORT}/apk/<file>`);
});
