<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 專案規範

- 所有 commit 及 push 必須使用 `@canis22788/git-czx`；不得使用會自動 commit 的腳手架。
- Commit message 包含 type、scope、subject、body；subject、body 使用中文，body 優先 Markdown 列點，scope 不使用專案名。
- `components/ui/` 保留 shadcn Base UI（preset `b1YmqvjO4`）與 Dice UI registry 的原生程式碼，不直接修改。
- 刪除須經 destructive Alert Dialog；表單使用 zod、FieldError，選項用 Select，載入用 Skeleton，空資料用 Empty，操作用 Toast。
- 對外 API 僅透過 Next 同源代理；MongoDB 使用 backend 的既有單機設定，thrift 集合及帳號獨立。
- 商品照片至少一張；所有交易寫入經 `backend/src/thrift/services/commerce.js` 原子更新，不單獨寫庫存或訂單。
