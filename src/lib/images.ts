const MAX_SIDE = 1280

export const compressReceiptImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Vui lòng chọn một tệp ảnh.'))
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
      const webp = canvas.toDataURL('image/webp', 0.7)
      const data = webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.68)
      if (data.length > 1_200_000) reject(new Error('Ảnh hóa đơn quá lớn. Hãy chọn ảnh nhỏ hơn.'))
      else resolve(data)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Không đọc được ảnh đã chọn.'))
    }
    image.src = url
  })
