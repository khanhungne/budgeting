import type { LotteryMarket, LotteryRegion } from './types'

export const LOTTERY_MARKET_LABELS: Record<LotteryMarket, string> = {
  south: 'Miền Nam', central: 'Miền Trung', north: 'Miền Bắc',
  hanoi_vip: 'Hà Nội VIP', hcm_vip: 'TP.HCM VIP',
}
export const LOTTERY_DRAW_TIMES: Record<LotteryMarket, string> = {
  south: '16:15', central: '17:15', north: '18:15', hanoi_vip: '18:15', hcm_vip: '17:30',
}
const SOUTH: Record<number, string[]> = {
  1:['TP.HCM','Đồng Tháp','Cà Mau'],2:['Bến Tre','Vũng Tàu','Bạc Liêu'],3:['Đồng Nai','Cần Thơ','Sóc Trăng'],4:['Tây Ninh','An Giang','Bình Thuận'],5:['Vĩnh Long','Bình Dương','Trà Vinh'],6:['TP.HCM','Long An','Bình Phước','Hậu Giang'],0:['Tiền Giang','Kiên Giang','Đà Lạt'],
}
const CENTRAL: Record<number, string[]> = {
  1:['Huế','Phú Yên'],2:['Quảng Nam','Đắk Lắk'],3:['Đà Nẵng','Khánh Hòa'],4:['Bình Định','Quảng Trị','Quảng Bình'],5:['Gia Lai','Ninh Thuận'],6:['Đà Nẵng','Quảng Ngãi','Đắk Nông'],0:['Khánh Hòa','Kon Tum','Huế'],
}
const NORTH: Record<number, string[]> = {
  1:['Hà Nội'],2:['Quảng Ninh'],3:['Bắc Ninh'],4:['Hà Nội'],5:['Hải Phòng'],6:['Nam Định'],0:['Thái Bình'],
}
export const marketToRegion = (market: LotteryMarket): LotteryRegion => market === 'hanoi_vip' ? 'north' : market === 'hcm_vip' ? 'south' : market
export const getLotteryStations = (market: LotteryMarket, date: string) => {
  const weekday = new Date(`${date}T12:00:00`).getDay()
  if (market === 'south') return SOUTH[weekday]
  if (market === 'central') return CENTRAL[weekday]
  if (market === 'north') return NORTH[weekday]
  return [LOTTERY_MARKET_LABELS[market]]
}
export const getLotteryDrawTime = (market: LotteryMarket) => LOTTERY_DRAW_TIMES[market]
export const getPendingUiLabel = (date: string, time: string, now = new Date()) => {
  const draw = new Date(`${date}T${time}:00`)
  return now < draw ? 'Chờ xổ' : 'Chờ cập nhật kết quả'
}
