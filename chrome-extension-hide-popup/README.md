# Cài đặt Extension Chrome - Auto Hide Popup Overlay

Extension này sẽ tự động ẩn tất cả các phần tử có class là `popup-overlay show` trên mọi trang web.

## Cách cài đặt:

1. Mở Chrome và truy cập vào địa chỉ: `chrome://extensions/`
2. Bật **Developer mode** (Chế độ dành cho nhà phát triển) ở góc trên bên phải.
3. Nhấp vào nút **Load unpacked** (Tải tiện ích đã giải nén).
4. Chọn thư mục `chrome-extension-hide-popup` (nằm trong `e:\Project2026\examtopics\chrome-extension-hide-popup`).
5. Xong! Extension sẽ tự động hoạt động trên tất cả các trang bạn mở.

## Các file chính:
- `manifest.json`: Khai báo thông tin extension.
- `content.js`: Script chính để tìm và ẩn các phần tử target. Sử dụng `MutationObserver` để ẩn ngay cả khi popup xuất hiện sau khi trang đã load.
- `icon.png`: Biểu tượng của extension.
