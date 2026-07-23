# Ví Nhỏ

PWA mobile-first để quản lý thu chi cá nhân. Frontend dùng React, Vite,
TypeScript và Tailwind CSS. Ứng dụng mặc định chạy demo bằng `localStorage`;
khi thêm biến môi trường, ứng dụng chuyển sang Supabase Auth + PostgreSQL.

Tất cả số tiền được nhập, lưu và hiển thị theo **VND**, không sử dụng phần thập
phân.

## Công nghệ

- React + TypeScript
- Vite
- Tailwind CSS v4
- Supabase Auth + PostgreSQL + RLS
- vite-plugin-pwa

## Cấu trúc chính

```text
src/
├── app/                  # Ghép các màn hình ở cấp ứng dụng
├── components/
│   ├── layout/           # Khung app và bottom navigation
│   ├── pwa/              # Cập nhật/cài PWA
│   └── ui/               # Component giao diện dùng lại
├── features/
│   ├── auth/             # Auth provider và màn hình đăng nhập
│   ├── budgets/          # Ngân sách chi tiêu theo tháng
│   ├── lottery/          # Sổ theo dõi, hạn mức, miền và đài
│   ├── transactions/     # API, hook, type và UI giao dịch
│   └── wallets/          # Ví tiền mặt/ngân hàng/ví điện tử
├── hooks/                # Hook dùng chung
├── lib/                  # Supabase, ngày tháng, định dạng tiền
└── pages/                # Các màn hình Tổng quan/Giao dịch/Tài khoản
```

## Chạy demo local

```powershell
npm install
npm run dev
```

Mở <http://localhost:5173>. Không cần tài khoản hoặc cấu hình Supabase. Bản demo
tự tạo một ít dữ liệu mẫu; các thay đổi được giữ trong `localStorage` của trình
duyệt hiện tại.

## Chức năng hiện có

- Thêm, sửa và xoá khoản thu/chi theo VND.
- Quản lý nhiều ví/tài khoản và tự tính số dư từng ví.
- Hiển thị tổng số dư hiện tại và biến động thu–chi theo tháng.
- Đặt ngân sách tháng và theo dõi mức đã sử dụng.
- Tìm kiếm theo ghi chú/danh mục và lọc thu/chi.
- Phân bổ khoản chi theo danh mục.
- Thống kê tỷ lệ tiết kiệm, chi trung bình/ngày, danh mục, nhịp chi tiêu và
  xu hướng thu–chi 3/6/12 tháng.
- Sổ lô đề ghi chép thủ công với miền, đài, tiền vào, tiền nhận, kết quả và
  thống kê lãi/lỗ.
- Danh sách đài theo ba miền, bộ lọc miền/đài và hạn mức tiền vào tự đặt theo
  tháng.
- Lọc giao dịch theo khoảng ngày và chuyển thống kê giữa cả tháng/một ngày.
- Xuất và nhập backup JSON trong chế độ demo.
- Cài lên màn hình chính dưới dạng PWA.
- Tải màn hình và dữ liệu theo nhu cầu; số dư ví được tổng hợp tại PostgreSQL khi
  dùng Supabase.

Phần lô đề chỉ dùng để ghi chép và kiểm soát tiền, không dự đoán kết quả, soi cầu
hoặc kết nối dịch vụ đặt cược.

## Toàn bộ web flow

### Tổng quan hành trình

```text
Mở web/PWA
    ↓
Đăng ký → Xác nhận email → Đăng nhập
    ↓
Khai báo ví và số dư ban đầu
    ↓
Thêm giao dịch thu/chi
    ↓
Trang chủ cập nhật tổng số dư, thu/chi và ngân sách
    ↓
Xem lịch sử → lọc giao dịch → xem thống kê
    ↓
Quản lý ví, cài PWA hoặc đăng xuất tại trang Tài khoản
```

Thanh điều hướng dưới cùng có năm màn hình:

| Màn hình | Mục đích |
| --- | --- |
| **Tổng quan** | Tổng số dư hiện tại, thu/chi tháng, ngân sách, danh mục và giao dịch gần đây |
| **Giao dịch** | Xem, tìm kiếm, lọc, sửa và xoá lịch sử thu/chi |
| **Lô đề** | Sổ ghi chép riêng, hạn mức và thống kê lãi/lỗ |
| **Thống kê** | Phân tích thu/chi theo ngày, tháng, danh mục và xu hướng |
| **Tài khoản** | Quản lý ví, trạng thái đồng bộ, cài PWA và đăng xuất |

Nút **+** màu vàng nằm phía trên thanh điều hướng luôn mở form thêm giao dịch
thu/chi, bất kể người dùng đang ở màn hình nào.

### Flow 1 — Đăng ký, xác nhận email và đăng nhập

#### Đăng ký

1. Mở tab **Đăng ký**.
2. Nhập email hợp lệ và mật khẩu tối thiểu 8 ký tự.
3. Chọn **Tạo tài khoản**.
4. Nếu Supabase đang bật **Confirm email**, mở email xác nhận và bấm liên kết.
5. Liên kết đưa người dùng về Site URL/Redirect URL đã cấu hình trong Supabase.
6. Quay lại màn hình **Đăng nhập** và đăng nhập bằng email, mật khẩu vừa tạo.

Nếu dùng dịch vụ gửi email mặc định của Supabase, project có giới hạn email rất
thấp. Production nên cấu hình Custom SMTP để email xác nhận và khôi phục mật khẩu
ổn định hơn.

#### Đăng nhập

1. Nhập email và mật khẩu.
2. Có thể dùng nút hình con mắt để hiện/ẩn mật khẩu.
3. Sau khi Supabase xác thực thành công, ứng dụng tải dữ liệu thuộc đúng tài
   khoản.
4. Phiên đăng nhập được lưu trong trình duyệt và tự làm mới cho đến khi người dùng
   đăng xuất hoặc phiên không còn hợp lệ.

#### Quên mật khẩu

1. Nhập email tại màn hình đăng nhập.
2. Chọn **Quên mật khẩu?**.
3. Mở liên kết Supabase gửi qua email.
4. Ứng dụng hiển thị màn hình **Đặt mật khẩu mới**.
5. Nhập hai lần mật khẩu mới, tối thiểu 8 ký tự, rồi cập nhật.

### Flow 2 — Khởi tạo tài khoản và ví đầu tiên

Sau lần đăng nhập đầu tiên, nếu tài khoản chưa có ví, ứng dụng tự tạo ví
**Tiền mặt** với số dư ban đầu `0 ₫`.

Người dùng nên vào **Tài khoản → Ví và tài khoản**:

1. Sửa ví mặc định hoặc chọn **+** để tạo ví mới.
2. Chọn loại ví: tiền mặt, ngân hàng hoặc ví điện tử.
3. Nhập tên, màu nhận diện và **Số dư ban đầu**.
4. Lưu ví.

**Số dư ban đầu** là số tiền thực tế đang có tại thời điểm bắt đầu theo dõi. Không
nhập lại số tiền này thành giao dịch **Tiền vào**, nếu không số dư sẽ bị cộng hai
lần.

Ví dụ: tài khoản ngân hàng đang có `5.000.000 ₫` khi bắt đầu dùng app thì nhập
`5.000.000` vào **Số dư ban đầu**. Chỉ các khoản phát sinh sau thời điểm đó mới
được tạo thành giao dịch.

### Flow 3 — Thêm, sửa và xoá giao dịch

#### Thêm giao dịch

1. Chọn nút **+** màu vàng.
2. Chọn **Tiền vào** hoặc **Tiền ra**.
3. Chọn ví nhận tiền hoặc ví bị trừ tiền.
4. Nhập số tiền VND.
5. Chọn danh mục phù hợp.
6. Chọn ngày giao dịch.
7. Nhập ghi chú nếu cần.
8. Chọn lưu.

Sau khi lưu:

- Giao dịch xuất hiện trong tháng tương ứng.
- Số dư của ví được tính lại.
- Tổng số dư trên trang chủ được cập nhật.
- Thu, chi, ngân sách và thống kê của tháng liên quan thay đổi theo giao dịch.

#### Sửa hoặc xoá

- Chọn một giao dịch trong danh sách để sửa các thông tin đã nhập.
- Chọn nút xoá và xác nhận để xoá vĩnh viễn giao dịch.
- Sau khi sửa/xoá, số dư ví và các số liệu liên quan được tính lại.

### Flow 4 — Trang Tổng quan

Màn hình **Tổng quan** mặc định mở ở tháng hiện tại. Người dùng có thể chuyển
tháng để xem số liệu của tháng khác.

#### Tổng số dư hiện tại

Con số lớn trên đầu trang sử dụng toàn bộ lịch sử giao dịch của các ví đang hoạt
động, không phụ thuộc tháng đang chọn:

```text
Tổng số dư hiện tại
= tổng số dư ban đầu của các ví đang hoạt động
+ toàn bộ tiền vào của các ví đó
− toàn bộ tiền ra của các ví đó
```

Ví đã lưu trữ vẫn giữ dữ liệu nhưng không được cộng vào tổng số dư trang chủ.
Khôi phục ví để đưa số dư của ví đó trở lại tổng.

#### Số liệu theo tháng

Các số **Biến động tháng**, **Tiền vào** và **Tiền ra** chỉ tính giao dịch thuộc
tháng đang chọn:

```text
Biến động tháng = Tiền vào trong tháng − Tiền ra trong tháng
```

Ví dụ: số dư ban đầu là `5.000.000 ₫`, sau đó nhận `10.000.000 ₫` và chi
`2.000.000 ₫`. Tổng số dư hiện tại là `13.000.000 ₫`; biến động tháng là
`8.000.000 ₫`.

#### Các khu vực khác

- **Ngân sách tháng:** so sánh hạn mức với tổng tiền ra trong tháng.
- **Chi theo danh mục:** cho biết nhóm chi tiêu chiếm tỷ lệ cao nhất.
- **Giao dịch mới:** hiển thị tối đa năm giao dịch gần đây của tháng đang chọn.
- **Xem tất cả:** chuyển sang màn hình Giao dịch.

### Flow 5 — Ngân sách tháng

1. Chọn tháng trên trang Tổng quan.
2. Nhập hoặc chỉnh hạn mức chi tiêu của tháng.
3. Ứng dụng so sánh tổng **Tiền ra** với hạn mức.
4. Thanh tiến độ thể hiện số tiền đã dùng, phần còn lại hoặc mức vượt.

Mỗi tháng có một ngân sách riêng. Tiền vào và số dư ban đầu không làm tăng phần
ngân sách còn lại; ngân sách chỉ theo dõi khoản chi.

### Flow 6 — Lịch sử Giao dịch

Màn hình **Giao dịch** chỉ tải giao dịch của tháng đang chọn. Người dùng có thể:

- Chuyển tháng.
- Tìm theo ghi chú hoặc tên danh mục.
- Lọc theo khoản thu/khoản chi.
- Lọc theo danh mục.
- Lọc theo khoảng ngày nằm trong tháng.
- Kết hợp nhiều bộ lọc và xoá toàn bộ bộ lọc.
- Sửa hoặc xoá giao dịch từ danh sách kết quả.

Bộ lọc chỉ thay đổi nội dung hiển thị, không thay đổi dữ liệu đã lưu.

### Flow 7 — Quản lý Ví và tài khoản tiền

Tại **Tài khoản → Ví và tài khoản**, mỗi ví hiển thị số dư riêng:

```text
Số dư ví = Số dư ban đầu + toàn bộ tiền vào ví − toàn bộ tiền ra khỏi ví
```

Người dùng có thể:

- Tạo nhiều ví.
- Sửa tên, loại, màu và số dư ban đầu.
- Lưu trữ ví không còn sử dụng.
- Khôi phục ví đã lưu trữ.

Không thể lưu trữ ví hoạt động cuối cùng. Sửa số dư ban đầu sẽ thay đổi toàn bộ số
dư hiện tại của ví; chỉ nên làm khi cần sửa dữ liệu khởi tạo.

### Flow 8 — Thống kê

Màn hình **Thống kê** phân tích các giao dịch của tháng đang chọn:

- Tỷ lệ tiết kiệm.
- Tổng thu, tổng chi và chênh lệch.
- Chi trung bình mỗi ngày.
- Số lượng giao dịch.
- Khoản chi lớn nhất.
- Phân bổ chi tiêu theo danh mục.
- Mức chi theo những ngày có phát sinh.
- Biểu đồ thu/chi trong 3, 6 hoặc 12 tháng gần nhất.

Người dùng có thể chọn một ngày cụ thể để thu hẹp thống kê trong tháng. Bỏ ngày
đã chọn để quay lại thống kê toàn tháng.

### Flow 9 — Sổ ghi chép Lô đề

Mục này là sổ ghi chép tài chính riêng, không dự đoán kết quả, soi cầu hoặc kết
nối dịch vụ đặt cược.

#### Thêm bản ghi

1. Chọn tháng và chọn **Thêm**.
2. Chọn miền và đài, hoặc nhập tên đài.
3. Nhập các số đã ghi.
4. Nhập tiền vào.
5. Chọn trạng thái: đang chờ, trúng hoặc trượt.
6. Nếu trúng, nhập tiền nhận.
7. Chọn ngày và thêm ghi chú nếu cần.

#### Theo dõi

- Đặt hạn mức tiền vào riêng cho từng tháng.
- Xem tổng tiền vào, tổng tiền nhận và chênh lệch tháng.
- Xem tỷ lệ các bản ghi đã trúng và số bản ghi đang chờ.
- Lọc theo miền và đài.
- Sửa hoặc xoá bản ghi.

```text
Chênh lệch sổ = Tổng tiền nhận − Tổng tiền vào
```

Sổ ghi chép này **không tự tạo giao dịch thu/chi và không ảnh hưởng số dư ví**.
Nếu muốn phản ánh tiền thật trong ví, người dùng phải tự tạo giao dịch tương ứng.

### Flow 10 — Trang Tài khoản

Trang **Tài khoản** cung cấp:

- Email đang đăng nhập.
- Trạng thái lưu cloud/local.
- Trạng thái trực tuyến/ngoại tuyến.
- Quản lý ví.
- Thông tin RLS bảo vệ dữ liệu theo tài khoản.
- Nút cài PWA.
- Nút đăng xuất khi dùng Supabase.

Trong chế độ demo không có Supabase, trang này còn có **Xuất backup** và
**Nhập backup** JSON. Nhập backup sẽ thay thế toàn bộ dữ liệu demo hiện tại.
Backup demo không áp dụng cho dữ liệu đang lưu trên Supabase.

### Flow 11 — Cài PWA và sử dụng khi mất mạng

- Android/Chrome: dùng nút **Cài ứng dụng** khi trình duyệt hỗ trợ.
- iPhone/iPad: mở bằng Safari → **Chia sẻ** → **Thêm vào MH chính**.
- PWA tự kiểm tra bản mới và thông báo khi cần tải lại.
- Giao diện đã cache có thể mở khi mất mạng.

Ở chế độ Supabase, ứng dụng hiện vẫn cần Wi-Fi hoặc dữ liệu di động để đăng nhập,
tải và lưu dữ liệu. Chưa có hàng đợi ghi offline để tự đồng bộ khi có mạng lại.
Không nên nhập dữ liệu mới khi thiết bị đang báo ngoại tuyến.

### Flow 12 — Dữ liệu và bảo mật Supabase

```text
Trình duyệt/PWA
    ↓
Supabase Auth xác định user_id
    ↓
RLS kiểm tra user_id trên từng thao tác
    ↓
PostgreSQL lưu dữ liệu của tài khoản
    ↓
View wallet_balances tổng hợp số dư từng ví
    ↓
Giao diện hiển thị dữ liệu đã được phép đọc
```

Các bảng cloud chính:

| Bảng/View | Dữ liệu |
| --- | --- |
| `wallets` | Ví, loại ví, số dư ban đầu và trạng thái lưu trữ |
| `transactions` | Giao dịch thu/chi |
| `monthly_budgets` | Ngân sách từng tháng |
| `lottery_entries` | Bản ghi của sổ lô đề |
| `lottery_limits` | Hạn mức sổ theo tháng |
| `wallet_balances` | View tính số dư hiện tại của từng ví |

RLS đảm bảo tài khoản A không đọc, sửa hoặc xoá dữ liệu của tài khoản B. Frontend
chỉ sử dụng Publishable key; không đưa Secret/Service Role key vào trình duyệt.

### Flow 13 — Local, GitHub và production

```text
Code local
    ↓ git push main
GitHub
    ↓ tự động build
Cloudflare Pages
    ↓ chạy frontend
Supabase Auth + PostgreSQL
```

- Local chạy tại <http://localhost:5173> bằng `npm run dev`.
- Production chạy tại <https://budgeting-eyv.pages.dev>.
- Cloudflare Pages build bằng `npm run build` và phục vụ thư mục `dist`.
- Cả local và production cùng dùng một Supabase project nếu URL/key giống nhau.
- Vì vậy dữ liệu tạo ở local cũng xuất hiện trên production của cùng tài khoản.
- `.env.local` chỉ dùng trên máy và không được commit lên GitHub.
- Cloudflare lưu các biến môi trường production riêng trong phần cài đặt project.

Khi push commit mới lên nhánh `main`, Cloudflare Pages tự tạo deployment mới. PWA
có thể còn giữ bundle cũ trong thời gian ngắn; đóng/mở lại app hoặc tải lại trang
để nhận phiên bản mới.

## Chuyển sang Supabase sau

1. Làm theo [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md).
2. Chạy [`supabase/schema.sql`](supabase/schema.sql) trong SQL Editor.
3. Sao chép `.env.example` thành `.env.local`.
4. Điền Project URL và Publishable key.
5. Khởi động lại `npm run dev`.

Khi `.env.local` hợp lệ, app tự tắt demo mode và hiển thị đăng ký/đăng nhập
Supabase. Dữ liệu demo hiện chưa tự chuyển vào cloud.

## Thiết lập Supabase

Sau khi kết nối, đăng ký hai tài khoản khác nhau để kiểm tra RLS trước khi phát
hành.

## Các lệnh

```powershell
npm run dev                 # Development server
npm run lint:types          # Kiểm tra TypeScript
npm test                    # Chạy unit test tự động
npm run build               # Build production + PWA
npm run preview             # Xem bản production local
```

Xem hướng dẫn deploy Cloudflare Pages, cấu hình Supabase production và cài app tại
[`docs/DEPLOY_AND_INSTALL.md`](docs/DEPLOY_AND_INSTALL.md).
