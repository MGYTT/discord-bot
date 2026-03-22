'use strict'

const config = require('../config')

const ADMIN_ROLE_IDS = [
  config.roles.Manager,
  config.roles.Owner,
].filter(Boolean)

function isAdmin(member) {
  return (
    member.permissions.has('ManageRoles') ||
    member.roles.cache.some(r => ADMIN_ROLE_IDS.includes(r.id))
  )
}

async function syncRoleOnDiscord(guild, discordId, oldRank, newRank) {
  try {
    const member   = await guild.members.fetch(discordId)
    const oldRoleId = config.roles[oldRank]
    const newRoleId = config.roles[newRank]

    if (oldRoleId) await member.roles.remove(oldRoleId).catch(() => {})
    if (newRoleId) await member.roles.add(newRoleId).catch(() => {})

    return true
  } catch {
    return false
  }
}

module.exports = { isAdmin, syncRoleOnDiscord }
