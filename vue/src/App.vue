<template>
  <div class="page">
    <!-- 1. 顶部最新版区域 -->
    <header class="latest-bar">
      <img src="./assets/logo.png" alt="Android Logo" class="android-logo" />
      <div class="info">
        <h1 class="title">监督监管平台</h1>
        <div class="version">最新版本：{{ latest.version }}</div>
        <div class="time">{{ format(latest.mtime) }}</div>
      </div>
      <el-button type="primary" size="large" @click="download(latest.fileName)">
        下载
      </el-button>
    </header>

    <!-- 2. 历史版本列表 -->
    <main class="history">
      <h3>历史版本</h3>
      <el-table :data="history" stripe style="width: 100%">
        <el-table-column prop="fileName" label="文件名" min-width="260" />
        <el-table-column prop="version" label="版本号" width="120" />
        <el-table-column label="文件时间" width="180">
          <template #default="{ row }">{{ format(row.mtime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="download(row.fileName)">
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import moment from "moment";

const apiBase = import.meta.env.VITE_API_BASE || "";
// console.log("API 基础路径：", apiBase);
const apkMap = ref({}); // 原始分组数据
const loading = ref(false);

/* ---------- 数据获取 ---------- */
async function load() {
  loading.value = true;
  try {
    const { data } = await axios.get(`${apiBase}/app/api/apk`);
    apkMap.value = data.data;
  } finally {
    loading.value = false;
  }
}
onMounted(load);

/* ---------- 计算属性 ---------- */
// 取第一组的最新版（如果有多包可再改）
const latest = computed(() => {
  const all = Object.values(apkMap.value).flat(); // 所有 apk 摊平
  if (!all.length) return {};
  return all.reduce((max, cur) =>
    cur.version.localeCompare(max.version, undefined, { numeric: true }) > 0
      ? cur
      : max
  );
});

// 历史版本 = 每组去掉第 0 个后合并，再整体按版本号降序
const history = computed(() => {
  const arr = [];
  console.log(apkMap.value);
  Object.values(apkMap.value).forEach((rows) => {
    arr.push(...rows);
    console.log("rows", rows);
  });
  console.log("历史版本原始数据", arr);
  return arr.sort((a, b) =>
    b.version.localeCompare(a.version, undefined, { numeric: true })
  );
});

/* ---------- 工具 ---------- */
function download(fileName) {
  window.open(`${apiBase}/apk/${encodeURIComponent(fileName)}`, "_blank");
}
const format = (t) => moment(t).format("YYYY-MM-DD HH:mm");
</script>

<style scoped>
.page {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

/* ----- 顶部最新版 ----- */
.latest-bar {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
}
.android-logo {
  width: 64px;
  height: 64px;
  margin-right: 20px;
}
.info {
  flex: 1;
}
.title {
  margin: 0;
  font-size: 24px;
  color: #2563eb;
}
.version {
  font-size: 16px;
  color: #606266;
  margin: 6px 0 2px;
}
.time {
  font-size: 13px;
  color: #909399;
}

/* ----- 历史区域 ----- */
.history h3 {
  margin: 0 0 12px;
}
</style>
