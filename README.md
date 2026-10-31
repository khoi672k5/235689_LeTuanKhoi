# 235689_LeTuanKhoi

## Hệ thống quản lý thiết bị phòng học trên nền tảng đám mây

Sinh viên: Lê Tuấn Khôi - MSSV: 235689
Học phần: Điện toán đám mây

## Mô tả đề tài

Ứng dụng web quản lý thiết bị phòng học gồm frontend, backend API và cơ sở dữ liệu MongoDB Atlas. Hệ thống hỗ trợ xem, tìm kiếm, thêm, cập nhật, xóa thiết bị và theo dõi tình trạng sử dụng (Đang sử dụng, Hư hỏng, Đang sửa chữa, Ngừng sử dụng).

## Công nghệ sử dụng

- Frontend: React
- Backend: Node.js, Express
- Cơ sở dữ liệu: MongoDB Atlas
- Quản lý mã nguồn: Git, GitHub
- Đóng gói: Docker, Docker Hub
- Triển khai: Render

## Cấu trúc dự án

## Hướng dẫn cài đặt và chạy

### Yêu cầu
- Node.js 18 trở lên
- Tài khoản MongoDB Atlas

### Backend
```bash
cd backend
npm install
cp .env.example .env   # điền PORT và MONGODB_URI của bạn
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```
## Chạy backend bằng Docker

Image: `khoi672k5/backend` trên Docker Hub.

```bash
# Build image
docker build -t khoi672k5/backend:latest ./backend

# Chạy container (truyền biến môi trường lúc chạy, không nhúng vào image)
docker run -d --name backend -p 5000:5000 \
  -e PORT=5000 \
  -e MONGODB_URI="<chuoi-ket-noi-mongodb-atlas>" \
  -e CORS_ORIGIN="*" \
  khoi672k5/backend:latest

# Kiểm tra
curl http://localhost:5000/health
```

Hoặc dùng tệp `.env`: `docker run -d -p 5000:5000 --env-file backend/.env khoi672k5/backend:latest`
## Liên kết

| Mục | URL |
|---|---|
| GitHub | https://github.com/khoi672k5/235689_LeTuanKhoi |
| Docker Hub Backend | (cập nhật ở Câu 5) |
| Docker Hub Frontend | (cập nhật ở Câu 6) |
| Render Frontend | (cập nhật ở Câu 7) |
| Render API | (cập nhật ở Câu 8) |
