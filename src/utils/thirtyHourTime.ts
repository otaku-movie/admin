/**
 * 提供 30 小时制时间（00:00 ~ 29:59）的常用工具函数，适用于跨夜排片等场景。
 */
export const THIRTY_HOUR_MINUTE_STEP = 30
export const MAX_THIRTY_HOUR_HOUR = 29

/**
 * 将「HH:mm」格式的 30 小时制字符串解析为分钟数。
 * 无效格式或超过 29:59 时返回 undefined。
 */
export const parseThirtyHourString = (
  value?: string,
  step = THIRTY_HOUR_MINUTE_STEP,
  allow24HourTail = true
) => {
  if (!value) return undefined
  const match = /^(\d{1,2}):([0-5][0-9])$/.exec(value)
  if (!match) return undefined
  const hour = Number.parseInt(match[1], 10)
  const minute = Number.parseInt(match[2], 10)
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > MAX_THIRTY_HOUR_HOUR ||
    minute < 0 ||
    minute >= 60
  ) {
    return undefined
  }
  const isStepAligned = minute % step === 0
  const isFinalTail =
    allow24HourTail && hour === MAX_THIRTY_HOUR_HOUR && minute === 59
  if (!isStepAligned && !(isFinalTail && step < 60)) {
    return undefined
  }
  return hour * 60 + minute
}

/**
 * 将分钟数格式化为「HH:mm」字符串（支持 29:59）。
 * 超出范围将返回 undefined。
 */
export const formatThirtyHourMinutes = (minutes?: number) => {
  if (minutes === undefined || minutes === null) return undefined
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  if (hour < 0 || hour > MAX_THIRTY_HOUR_HOUR) return undefined
  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}`
}

/**
 * 对 30 小时制时间字符串进行解析并重新格式化，输出规范化的字符串。
 * 无法解析时返回 undefined。
 */
export const normalizeThirtyHourString = (value?: string) => {
  const minutes = parseThirtyHourString(value)
  if (minutes === undefined) return undefined
  return formatThirtyHourMinutes(minutes)
}

/**
 * 根据步长生成 30 小时制的下拉选项，用于选择器等场景。
 */
export const generateThirtyHourOptions = (
  step = THIRTY_HOUR_MINUTE_STEP,
  allow24HourTail = true
) => {
  const tailMinute = allow24HourTail ? 59 : 0
  const rawSlots = Math.floor((MAX_THIRTY_HOUR_HOUR * 60) / step) + 1
  const includeTail = allow24HourTail && tailMinute !== 0 && step < 60
  const totalSlots = includeTail ? rawSlots + 1 : rawSlots

  return Array.from({ length: totalSlots }, (_, index) => {
    const minutes = index * step
    const isLast = includeTail && index === totalSlots - 1
    const label = isLast
      ? `${MAX_THIRTY_HOUR_HOUR.toString().padStart(2, '0')}:59`
      : formatThirtyHourMinutes(minutes)!
    return {
      value: label,
      label
    }
  })
}

