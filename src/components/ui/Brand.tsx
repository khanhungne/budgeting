export const Brand = ({ compact = false }: { compact?: boolean }) => (
  <div className="flex items-center gap-3">
    <img
      src="/favicon.svg"
      alt=""
      className={`${compact ? 'size-10 rounded-xl' : 'size-14 rounded-2xl'} shadow-lg`}
    />
    <div>
      <p className={`${compact ? 'text-lg' : 'text-2xl'} font-black tracking-tight text-emerald-950`}>
        Ví Nhỏ
      </p>
      {!compact && <p className="text-sm text-slate-500">Gọn từng khoản, nhẹ từng ngày.</p>}
    </div>
  </div>
)
