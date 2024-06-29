export function showTotal(total: number, range: number[]) {
  const [start, end] = range

  return `合計 ${total} 件, 現在 ${start} ～ ${end} 件`
}
