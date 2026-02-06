export const formatTime = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  )
}

const formatNumber = (n: number) => {
  const s = n.toString()
  return s[1] ? s : '0' + s
}

/**
 * 判断用户是否已授权(即是否有权限进行核心操作)
 * 逻辑: isAuthed 为 true 或者 存在手机号
 */
export const checkIsAuthed = (user: any): boolean => {
  if (!user) return false;
  return !!(user.isAuthed === true || user.phoneNumber || user.phone);
}

