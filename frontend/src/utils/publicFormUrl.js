export function publicFormUrl(userId) {
  if (!userId) return `${window.location.origin}/form`
  return `${window.location.origin}/form?user_id=${userId}`
}
