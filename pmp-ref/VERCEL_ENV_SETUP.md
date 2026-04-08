# Hướng dẫn cấu hình Environment Variables trên Vercel

Sau khi deploy lên Vercel, bạn cần thêm các environment variables sau:

## Bước 1: Truy cập Vercel Dashboard
1. Vào https://vercel.com/dashboard
2. Chọn project `pmp-quizz`
3. Vào tab **Settings** → **Environment Variables**

## Bước 2: Thêm các biến sau

### Supabase (Frontend - Vite)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Lưu ý**: Lấy giá trị thực từ file `.env` local của bạn

### Hugging Face (Serverless Function)
```
HUGGINGFACE_API_KEY=hf_your_huggingface_api_key_here
HF_MODEL=meta-llama/Llama-3.1-70B-Instruct
```

**Lưu ý**: Lấy API key thực từ file `.env` local của bạn

## Bước 3: Redeploy
Sau khi thêm environment variables, click **Redeploy** để áp dụng thay đổi.

## Lưu ý
- `HUGGINGFACE_API_KEY` và `HF_MODEL` chỉ cần thiết cho serverless function (`/api/ai`)
- Không cần expose API key ra frontend vì ta đã dùng proxy API
