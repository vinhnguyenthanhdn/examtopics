# PMP AI Cache Builder Guide

## 📋 Tổng quan

Script `cache_ai_hf.py` sử dụng **Hugging Face Inference API** để tạo cache AI cho câu hỏi PMP, bao gồm:
- **Theory (Lý thuyết)**: Giải thích các thuật ngữ PMP trong câu hỏi và đáp án
- **Explanation (Giải thích)**: Phân tích câu hỏi, đáp án đúng/sai, mẹo ghi nhớ

**Đặc biệt**: Với tiếng Việt, AI sẽ **dịch câu hỏi sang tiếng Việt** trước khi giải thích!

---

## 🔧 Cấu hình

### 1. Environment Variables (.env.local)

```env
# Supabase (bắt buộc)
VITE_SUPABASE_URL=https://kowpqhvjlykpjwjxxhrf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Hugging Face (bắt buộc)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx

# Model (tùy chọn, mặc định: Qwen/Qwen2.5-72B-Instruct)
HF_MODEL=Qwen/Qwen2.5-72B-Instruct
```

### 2. Lấy Hugging Face API Key

1. Đăng ký tài khoản tại: https://huggingface.co/
2. Vào **Settings** → **Access Tokens**
3. Tạo token mới với quyền **Read**
4. Copy token và thêm vào `.env.local`

### 3. Recommended Models

**Free Tier (Serverless Inference API):**
- ✅ `Qwen/Qwen2.5-72B-Instruct` - **Recommended** (Excellent quality, multilingual)
- ✅ `meta-llama/Llama-3.1-70B-Instruct` - Very good quality
- ✅ `mistralai/Mixtral-8x7B-Instruct-v0.1` - Fast, good quality
- ✅ `google/gemma-2-27b-it` - Strong reasoning

**Note**: Serverless endpoints có thể có cold start (10-30s lần đầu).

---

## 🚀 Cách sử dụng

### Cú pháp cơ bản

```bash
python cache_ai_hf.py <range> [options]
```

### Ví dụ

```bash
# Cache câu 1-10 (tiếng Việt, cả theory + explanation)
python cache_ai_hf.py 1-10

# Cache câu 1-50 (tiếng Anh)
python cache_ai_hf.py 1-50 --lang en

# Chỉ cache explanation (bỏ qua theory)
python cache_ai_hf.py 1-20 --type explanation

# Chỉ cache theory
python cache_ai_hf.py 1-20 --type theory

# Ghi đè cache cũ (force overwrite)
python cache_ai_hf.py 1-10 --force

# Cache toàn bộ 1386 câu hỏi (mất nhiều thời gian!)
python cache_ai_hf.py 1-1386
```

### Options

| Option | Mô tả | Giá trị mặc định |
|--------|-------|------------------|
| `range` | Range câu hỏi (VD: 1-10) | **Bắt buộc** |
| `--lang` | Ngôn ngữ (vi/en) | `vi` |
| `--type` | Loại cache (theory/explanation) | Cả hai |
| `--force` | Ghi đè cache cũ | `False` |

---

## 📊 Output mẫu

### Successful Run

```
🔑 Using Hugging Face API Key: hf_K...neGO
🤖 Model: Qwen/Qwen2.5-72B-Instruct

╔══════════════════════════════════════════════════════════════╗
║           PMP Exam AI Cache Builder (Hugging Face)          ║
╠══════════════════════════════════════════════════════════════╣
║  Range: 1 - 10                                              
║  Language: Tiếng Việt                                      
║  Model: Qwen/Qwen2.5-72B-Instruct
╚══════════════════════════════════════════════════════════════╝

📚 Đang lấy câu hỏi từ 1 đến 10...
✅ Tìm thấy 10 câu hỏi

[1/10] Câu hỏi: 1 (vi)
   🤖 Đang tạo theory với Hugging Face (Qwen/Qwen2.5-72B-Instruct)...
   ✅ Theory đã lưu vào cache
   🤖 Đang tạo explanation với Hugging Face (Qwen/Qwen2.5-72B-Instruct)...
   ✅ Explanation đã lưu vào cache

[2/10] Câu hỏi: 2 (vi)
   ✓ Theory đã có cache, bỏ qua
   ✓ Explanation đã có cache, bỏ qua
...
```

---

## ⏱️ Thời gian ước tính

| Số câu | Theory + Explanation | Chỉ Explanation |
|--------|---------------------|-----------------|
| 10 | ~5-10 phút | ~3-5 phút |
| 50 | ~25-40 phút | ~15-25 phút |
| 100 | ~50-80 phút | ~30-50 phút |
| 1386 | ~12-20 giờ | ~7-12 giờ |

**Note**: 
- Thời gian phụ thuộc vào model và tải của Hugging Face
- Script có retry logic và rate limiting (3s delay giữa các calls)
- Có thể chạy từng batch nhỏ (VD: 1-50, 51-100, ...)

---

## 🎯 Chiến lược Cache hiệu quả

### Option 1: Cache từng batch nhỏ
```bash
# Batch 1: Câu 1-100
python cache_ai_hf.py 1-100

# Batch 2: Câu 101-200
python cache_ai_hf.py 101-200

# ... tiếp tục
```

### Option 2: Cache chỉ explanation (nhanh hơn)
```bash
# Chỉ cache explanation cho tất cả câu
python cache_ai_hf.py 1-1386 --type explanation
```

### Option 3: Cache theo độ ưu tiên
```bash
# Cache câu thường gặp nhất trước (1-200)
python cache_ai_hf.py 1-200

# Sau đó cache phần còn lại khi rảnh
python cache_ai_hf.py 201-1386
```

---

## 🔍 Kiểm tra Cache

### Trong Supabase Dashboard

1. Vào **Table Editor** → `pmp_ai_cache`
2. Filter theo `question_id`, `language`, `type`
3. Xem nội dung cache

### Query SQL

```sql
-- Đếm số cache đã tạo
SELECT 
    language,
    type,
    COUNT(*) as count
FROM pmp_ai_cache
GROUP BY language, type
ORDER BY language, type;

-- Xem cache của câu hỏi cụ thể
SELECT * 
FROM pmp_ai_cache 
WHERE question_id = '1' 
  AND language = 'vi';
```

---

## ⚠️ Troubleshooting

### Issue: "Model is loading..."
**Nguyên nhân**: Serverless endpoint đang cold start  
**Giải pháp**: Đợi 10-30s, script sẽ tự retry

### Issue: "503 Service Unavailable"
**Nguyên nhân**: Model quá tải hoặc đang bảo trì  
**Giải pháp**: 
- Đợi vài phút rồi thử lại
- Hoặc đổi sang model khác (edit `HF_MODEL` trong `.env.local`)

### Issue: "Rate limit exceeded"
**Nguyên nhân**: Gọi API quá nhanh  
**Giải pháp**: Script đã có delay 3s, nếu vẫn lỗi, tăng delay trong code

### Issue: "Invalid API key"
**Nguyên nhân**: API key sai hoặc hết hạn  
**Giải pháp**: Tạo token mới tại Hugging Face

### Issue: Cache không lưu được (401 Unauthorized)
**Nguyên nhân**: RLS policy chưa được fix  
**Giải pháp**: Chạy `fix_all_pmp_rls_policies.sql` trong Supabase

---

## 💡 Tips

1. **Chạy ban đêm**: Cache số lượng lớn khi không dùng máy
2. **Dùng tmux/screen**: Để script chạy background không bị ngắt
3. **Monitor progress**: Theo dõi console để biết tiến độ
4. **Backup cache**: Export `pmp_ai_cache` table định kỳ
5. **Test trước**: Cache 1-5 câu để test model quality trước khi cache hàng loạt

---

## 📝 Ví dụ workflow hoàn chỉnh

```bash
# 1. Test với 2 câu đầu tiên
python cache_ai_hf.py 1-2

# 2. Kiểm tra kết quả trong Supabase
# Nếu OK, tiếp tục

# 3. Cache batch đầu tiên (100 câu)
python cache_ai_hf.py 1-100

# 4. Chạy app để test
npm run dev

# 5. Nếu hài lòng, cache toàn bộ
python cache_ai_hf.py 101-1386
```

---

## 🆘 Support

Nếu gặp vấn đề:
1. Check logs trong console
2. Verify `.env.local` có đầy đủ credentials
3. Test với 1-2 câu trước
4. Check Hugging Face API status: https://status.huggingface.co/

---

**Happy Caching! 🚀**
