'use strict'

// memberId:commandName → timestamp ostatniego użycia
const cooldowns = new Map()

/**
 * Sprawdza cooldown. Zwraca pozostały czas w sekundach lub 0 jeśli można użyć.
 */
function checkCooldown(userId, commandName, seconds = 5) {
  const key  = `${userId}:${commandName}`
  const now  = Date.now()
  const last = cooldowns.get(key) ?? 0
  const diff = now - last

  if (diff < seconds * 1000) {
    return Math.ceil((seconds * 1000 - diff) / 1000)
  }

  cooldowns.set(key, now)
  return 0
}

module.exports = { checkCooldown }
