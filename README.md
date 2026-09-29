# THRIFT｜二手好物

二手物品展示、訪客／會員購物車、獨立帳號、商品／分類／訂單／帳號管理。

前端根目錄為 `thrift`，API 在相鄰 `backend/src/thrift`。Repo：<https://github.com/Canis-Infinity/thrift.canis.world.git>。

## 啟動

先依 backend 既有設定啟動 MongoDB 與 backend（沿用 `MONGODB_CONNECT`，不需 replica set 或額外資料庫）。

在 `thrift` 執行：

```sh
docker compose up -d --force-recreate
```

開啟 <http://localhost:7346>。預設透過 `http://host.docker.internal:7344` 存取後端；不需要新增 `.env`。若要改連接埠或 API 位址，參考 `.env.example`。

Compose 每次啟動都執行 `npm ci`、production build、Next start；首次需等待依賴下載與字型下載。`docker compose ps` 的狀態為 healthy 代表前端已就緒。對外代理請將 `thrift.canis.world` 指向前端 7346，HTTPS 可啟用 PWA。反向代理上傳限制至少 13MB；Nginx 可設 `client_max_body_size 16m;`。

在 backend 建立管理員：

```sh
npm run create-thrift-admin
# 或
docker compose exec backend npm run create-thrift-admin
```

依提示輸入姓名、信箱、手機、聯繫平台／帳號及密碼。密碼至少 12 個字元。此指令不影響 debt 帳號。

## 開發與檢查

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm run format:check
npm run build
```

本機 `npm run dev` 預設呼叫 `http://127.0.0.1:7344`。Docker 使用 `.env.example` 中的內部位址。

後端整合測試（使用自動建立與銷毀的單機 MongoDB）：

```sh
cd ../backend
npm test
```

端對端測試：先於 backend 設定 `THRIFT_E2E=1` 並執行 `node scripts/thrift-e2e-server.js`，啟動臨時 API 17446；再將前端 `INTERNAL_API_BASE_URL` 指向此 API，啟動前端後執行：

```sh
npm run test:e2e
```

測試預設 URL `http://localhost:7346`，可用 `E2E_BASE_URL` 覆蓋。測試管理員僅存在臨時資料庫，請勿用於正式站。

## 技術與元件

Next.js App Router、React、TypeScript、Tailwind v4、shadcn/ui Base UI、Dice UI File Upload、Lucide、zod、next-themes、nextjs-toploader、Prettier、PWA。

初始化使用指定的 `npx shadcn@latest init --preset b1YmqvjO4 --template next --pointer`。`components/ui` 保留 registry 原生輸出；業務邏輯由外層元件組合。

## 功能規劃與限制

完整規則及查漏補缺結果見 [IMPLEMENTATION.md](./IMPLEMENTATION.md)。後端維運見 `../backend/docs/thrift.md`。

所有 commit／push 必須經 `@canis22788/git-czx`，且 commit 包含 type、scope、中文 subject 與中文條列 body。此套件目前提供 commit 介面，沒有 push 子命令，未自行改用原生 git push。
