# Remote testing without AWS deploy (cloudflared tunnel)

เปิดให้ผู้ทดสอบที่อยู่คนละที่/รีโมทเข้ามาลองใช้แอปได้ **โดยไม่ต้อง deploy อะไรขึ้น AWS**
แอปรันบนเครื่อง dev ของเรา ส่วน DB (Lightsail Postgres) และรูป (S3) ใช้ของเดิมบน AWS ที่ provision ไว้แล้ว

## เส้นทาง request

```
tester (ทั่วโลก)
  → https://<random>.trycloudflare.com        (cloudflared quick tunnel)
    → http://localhost:5173                    (Vite dev server)
      → proxy /api → http://localhost:3000     (backend, ตั้งใน vite.config.js)
        → AWS Lightsail Postgres + S3
```

Frontend เรียก API แบบ **same-origin** (`/api`) → **ไม่มีปัญหา CORS, ใช้ tunnel ตัวเดียว**

## ค่าคอนฟิกที่ทำให้ทำงาน (แก้ครั้งเดียว อยู่ในโค้ดแล้ว)

- `vite.config.js` → `server` block:
  - `host: true` — ให้ Vite ฟังที่ 0.0.0.0 (tunnel เข้าถึงได้)
  - `allowedHosts: ['.trycloudflare.com']` — Vite 4.5+ block host แปลกหน้า ต้อง whitelist
  - `proxy['/api'] → http://localhost:3000` — ส่งต่อไป backend
- `.env` → `VITE_API_BASE_URL=/api` (relative path → วิ่งผ่าน proxy; ค่าเดิม `http://localhost:3000/api` comment ไว้ให้สลับกลับ)

### CORS: ทำไม proxy ต้องเขียน Origin ใหม่

Backend (`sfcmes-backend-v3/src/config/cors.js`) เช็ค `Origin` header กับ whitelist — host ของ tunnel (`*.trycloudflare.com`) ไม่อยู่ในนั้น
proxy ของ Vite `changeOrigin:true` เปลี่ยนแค่ `Host` **ไม่เปลี่ยน `Origin`** → backend เห็น origin ของ tunnel แล้ว block ตอน login

แก้ที่ proxy ให้เขียน `Origin` เป็น `http://localhost:5173` (อยู่ใน whitelist อยู่แล้ว) ก่อนส่งเข้า backend — ไม่ต้องแตะ backend และไม่พังเมื่อ tunnel URL เปลี่ยน:

```js
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.setHeader('origin', 'http://localhost:5173');
      });
    },
  },
},
```

## วิธีเปิด (รัน 3 อย่างพร้อมกัน)

```bash
# 1) backend
cd sfcmes-backend-v3 && npm run dev

# 2) frontend
cd sfcmes-frontend-v3 && npm run dev

# 3) tunnel
cloudflared tunnel --url http://localhost:5173
```

cloudflared จะพ่น URL ออกมาแบบ:

```
https://<คำสุ่ม>.trycloudflare.com
```

ก๊อป URL นั้นส่งให้ผู้ทดสอบ เปิดได้ทันทีทั้งมือถือ/คอม

### ติดตั้ง cloudflared (ครั้งแรกครั้งเดียว)

```bash
brew install cloudflared
```

## ตรวจว่าใช้ได้จริง

```bash
U=https://<คำสุ่ม>.trycloudflare.com
curl -s -o /dev/null -w "%{http_code}\n" "$U/"           # 200 = หน้าเว็บโหลดได้
curl -s -o /dev/null -w "%{http_code}\n" "$U/api/projects" # 200 = ทะลุถึง backend + DB
```

## ข้อจำกัด / ข้อควรระวัง

- **URL เปลี่ยนทุกครั้งที่ปิด-เปิด tunnel** (quick tunnel ฟรี ไม่ต้องสมัคร) — ต้องส่ง URL ใหม่ให้ผู้ทดสอบทุกครั้ง
- **เครื่อง dev ต้องเปิดค้างไว้** ปิดเครื่อง = ลิงก์ดับ (นี่คือการ "ให้ยืมเครื่องเราผ่านเน็ต")
- **ชนกับ DB จริงบน AWS** — ผู้ทดสอบ login/แก้/ลบข้อมูลจริงได้ ระวังข้อมูลจริงถูกแก้ โดยเฉพาะรูปไซต์งานบน S3
- **HMR (auto-reload ตอนแก้โค้ด) อาจไม่ทำงานผ่าน tunnel** แต่ตัวแอปใช้งานได้ปกติ

## Develop ต่อได้ระหว่าง tunnel รันอยู่ (demo แช่แข็ง + dev แยก)

ปัญหา: ถ้า demo กับ dev ใช้ Vite ตัวเดียวกัน พอแก้โค้ด HMR จะ reload → ผู้ทดสอบเจอจอกระตุก/พัง
วิธีแก้: แยกเป็น 2 instance ด้วย **git worktree** — demo รันจาก checkout ที่แช่แข็ง (ไฟล์ไม่เปลี่ยน) ส่วน dev แก้ในโฟลเดอร์หลัก

```
demo (แช่แข็ง)  worktree /Users/mac/dev/sfcmes-frontend-demo → Vite :5173 ← tunnel ชี้ตัวนี้
dev  (คุณแก้)   โฟลเดอร์หลัก sfcmes-frontend-v3            → Vite :5174   HMR สด
backend         :3000 (ใช้ร่วมกัน)  →  AWS DB/S3 (ใช้ร่วมกัน)
```

หมายเหตุ: DB ใช้ร่วมกัน — dev กับ demo เห็นข้อมูลชุดเดียวกัน (แยกแค่โค้ด/หน้าจอ ไม่แยกข้อมูล)

### setup demo worktree (ทำครั้งเดียว)

```bash
cd sfcmes-frontend-v3
DEMO=/Users/mac/dev/sfcmes-frontend-demo
git worktree add --detach "$DEMO" HEAD          # แช่แข็งที่ commit ปัจจุบัน
cp vite.config.js "$DEMO/vite.config.js"        # เอา config ที่มี proxy ไปด้วย
cp .env "$DEMO/.env"                            # VITE_API_BASE_URL=/api
ln -sfn "$(pwd)/node_modules" "$DEMO/node_modules"  # symlink ไม่ต้อง install ใหม่
```

worktree ต้องแก้ `vite.config.js` เพิ่ม 2 อย่าง (เพราะ node_modules เป็น symlink):
- `cacheDir: resolve(__dirname, '.vite-demo-cache')` — กัน cache ชนกับ dev server
- `server.fs = { strict: false }` — ให้เสิร์ฟไฟล์ (ฟอนต์ ฯลฯ) ที่ resolve ออกไป path จริงนอก worktree ได้

### รันประจำวัน

```bash
# demo (แช่แข็ง) — เทอร์มินัล 1
cd /Users/mac/dev/sfcmes-frontend-demo && npm run dev -- --port 5173 --strictPort
# dev (คุณแก้)  — เทอร์มินัล 2
cd sfcmes-frontend-v3 && npm run dev -- --port 5174
# backend       — เทอร์มินัล 3
cd sfcmes-backend-v3 && npm run dev
# tunnel        — เทอร์มินัล 4  (ชี้ :5173 = demo)
cloudflared tunnel --url http://localhost:5173
```

แก้โค้ดในโฟลเดอร์หลัก → เห็นผลที่ :5174 ทันที (HMR) — **demo :5173 ไม่กระเทือน**

### อยากให้ demo อัปเดตเป็นเวอร์ชันล่าสุด

demo แช่แข็งที่ commit ตอนสร้าง worktree จะไม่ขยับตามงาน dev พอจะอัปเดต:

```bash
cd /Users/mac/dev/sfcmes-frontend-demo
git fetch && git checkout <commit-ล่าสุด>   # หรือ git reset --hard <branch>
# แล้ว restart Vite :5173
```
(ตรวจว่า vite.config.js ใน worktree ยังมี proxy/cacheDir/fs.strict อยู่ ถ้า checkout ทับต้อง copy ใหม่)

### ลบ demo worktree เมื่อเลิกใช้

```bash
cd sfcmes-frontend-v3
git worktree remove /Users/mac/dev/sfcmes-frontend-demo --force
```

## ให้ tunnel อยู่รอดเมื่อปิด session/เครื่องมือ (รัน cloudflared เอง)

ถ้าเปิด cloudflared ผ่านเครื่องมือ/agent (เช่น Claude Code) process จะเป็น "ลูก" ของเครื่องมือนั้น
พอปิด session → cloudflared ตาย → **URL สาธารณะดับ ผู้ทดสอบเข้าไม่ได้** (ส่วน Vite/backend ที่ detached แล้วจะรอด)

วิธีที่คุมง่ายสุด: **รัน cloudflared ในเทอร์มินัลของตัวเอง** (Terminal.app / iTerm — ไม่ใช่ในเครื่องมือ)

```bash
# กันเครื่องหลับด้วย caffeinate ในบรรทัดเดียว
caffeinate -s cloudflared tunnel --url http://localhost:5173
```

จากนั้น:
1. copy URL `https://xxxx.trycloudflare.com` ที่มันพ่นออกมา → ส่งให้ผู้ทดสอบ
2. **อย่าปิดหน้าต่างเทอร์มินัลนี้ อย่ากด Ctrl-C** ปล่อยรันค้างไว้
3. ปิด session ของเครื่องมือได้เลย tunnel ยังอยู่

> ⚠️ ถ้าเปลี่ยนมาเปิดตัวใหม่นี้ **URL จะเปลี่ยนจากตัวเดิม** (quick tunnel สุ่มใหม่ทุกครั้ง) — ส่ง URL ใหม่ให้ผู้ทดสอบ

ตรวจว่าใช้ได้:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<url-ใหม่>.trycloudflare.com/   # 200 = ok
```

### รอดแม้ปิดหน้าต่างเทอร์มินัล (tmux)

```bash
tmux new -s tunnel
cloudflared tunnel --url http://localhost:5173
# กด Ctrl-b แล้ว d เพื่อ detach — tunnel รันต่อเบื้องหลัง
tmux attach -t tunnel   # กลับมาดู/หยุด (Ctrl-C)
```

### หยุด tunnel
กลับไปหน้าต่างที่รันอยู่แล้วกด **Ctrl-C** (tmux: `tmux attach -t tunnel` ก่อน)

### อะไรรอด / อะไรตาย เมื่อปิด session ของเครื่องมือ

| process | รอด? | เพราะ |
|---|---|---|
| cloudflared ที่เครื่องมือเปิด | ❌ ตาย | เป็นลูกของ process เครื่องมือ |
| cloudflared ที่คุณรันเองในเทอร์มินัล | ✅ รอด | ผูกกับเทอร์มินัลของคุณ |
| demo Vite :5173 / backend :3000 | ✅ รอด | รันแยก/detached ไม่ผูก session |

## อยากได้ URL คงที่ (ไม่เปลี่ยนทุกครั้ง)

Quick tunnel ให้ URL สุ่มเสมอ ถ้าต้องการ URL ตายตัว เลือกอย่างใดอย่างหนึ่ง:

- **cloudflared named tunnel** — ต้องมี domain ผูกกับ Cloudflare (`cloudflared tunnel create` + `route dns`)
- **ngrok named domain** — ของเดิมที่เคยใช้ (`sfcpcbackend.ngrok.app`) ต้องเป็นแพลนเสียเงิน
