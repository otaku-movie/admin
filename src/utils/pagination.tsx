export function showTotal(total: number, range: number[]) {
  const [start, end] = range

  return `总共 ${total} 条, 当前${start} ~ ${end}条`
}
