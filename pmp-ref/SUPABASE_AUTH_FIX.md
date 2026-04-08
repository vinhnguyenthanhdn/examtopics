# Hướng dẫn Fix lỗi Login Redirect về Web cũ (AWS)

Hiện tại, việc bạn bị redirect về web cũ (AWS) sau khi login Google là do cấu hình trong **Supabase Authentication**.

Mặc dù code frontend đã gửi yêu cầu redirect về trang hiện tại (`window.location.origin`), nhưng Supabase sẽ từ chối URL này nếu nó không nằm trong danh sách "Redirect URLs" được cho phép, và sẽ tự động redirect về "Site URL" mặc định (đang bị set là web AWS cũ).

## Các bước xử lý:

1. **Truy cập Supabase Dashboard**:
   - Vào project PMP của bạn trên Supabase.

2. **Vào phần Authentication**:
   - Chọn icon **Authentication** ở menu bên trái.
   - Chọn **URL Configuration**.

3. **Cập nhật Site URL**:
   - Ở mục **Site URL**, đổi địa chỉ web cũ (AWS) thành địa chỉ web mới của bạn (ví dụ: `https://pmp-prep.vercel.app` hoặc domain chính thức).

4. **Thêm Redirect URLs** (Quan trọng):
   - Ở mục **Redirect URLs**, bạn cần thêm tất cả các URL mà ứng dụng chạy trên đó, bao gồm cả localhost server để test.
   - Nhấn **Add URL** và thêm:
     - `http://localhost:5173/` (hoặc port bạn đang chạy dev)
     - `http://localhost:3000/` (nếu dùng port khác)
     - `https://your-production-url.com/` (URL production mới)
     - `https://your-production-url.com` (không có dấu / ở cuối cũng nên thêm cho chắc)

5. **Lưu lại**:
   - Nhấn **Save**.

Sau khi cấu hình xong, hãy thử login lại. Supabase sẽ chấp nhận URL `localhost` hoặc URL mới và redirect đúng chỗ.
