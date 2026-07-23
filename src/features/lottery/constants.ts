import type { LotteryPlayType, LotteryRegion, LotteryStatus } from './types'

export const LOTTERY_TYPE_LABELS: Record<LotteryPlayType, string> = {
  lo: 'Lô',
  de: 'Đề',
  xien: 'Xiên',
  other: 'Khác',
}

export const LOTTERY_STATUS_LABELS: Record<LotteryStatus, string> = {
  pending: 'Chờ kết quả',
  won: 'Trúng',
  lost: 'Không trúng',
}

export const LOTTERY_REGION_LABELS: Record<LotteryRegion, string> = {
  north: 'Miền Bắc',
  central: 'Miền Trung',
  south: 'Miền Nam',
}

export const LOTTERY_STATIONS: Record<LotteryRegion, string[]> = {
  north: [
    'Hà Nội',
    'Quảng Ninh',
    'Bắc Ninh',
    'Hải Phòng',
    'Nam Định',
    'Thái Bình',
    'Hà Nội VIP',
  ],
  central: [
    'Huế',
    'Phú Yên',
    'Đắk Lắk',
    'Quảng Nam',
    'Đà Nẵng',
    'Khánh Hòa',
    'Bình Định',
    'Quảng Bình',
    'Quảng Trị',
    'Gia Lai',
    'Ninh Thuận',
    'Quảng Ngãi',
    'Đắk Nông',
    'Kon Tum',
  ],
  south: [
    'TP.HCM',
    'Đồng Tháp',
    'Cà Mau',
    'Bến Tre',
    'Vũng Tàu',
    'Bạc Liêu',
    'Đồng Nai',
    'Cần Thơ',
    'Sóc Trăng',
    'Tây Ninh',
    'An Giang',
    'Bình Thuận',
    'Bình Dương',
    'Trà Vinh',
    'Vĩnh Long',
    'Long An',
    'Bình Phước',
    'Hậu Giang',
    'Tiền Giang',
    'Kiên Giang',
    'Đà Lạt',
    'TP.HCM VIP',
  ],
}

export const normalizeLotteryNumbers = (value: string) =>
  [...new Set(value.split(/[\s,;]+/).map((number) => number.trim()).filter(Boolean))]
