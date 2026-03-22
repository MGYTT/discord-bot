'use strict'

require('dotenv').config()

function required(key) {
  const val = process.env[key]
  if (!val) throw new Error(`Brakuje zmiennej środowiskowej: ${key}`)
  return val
}

function optional(key, fallback = null) {
  return process.env[key] ?? fallback
}

const config = {
  discord: {
    token:    required('DISCORD_BOT_TOKEN'),
    clientId: required('DISCORD_CLIENT_ID'),
    guildId:  required('DISCORD_GUILD_ID'),
  },

  supabase: {
    url:            required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  },

  site: {
    url: optional('SITE_URL', 'https://gloslogistics.pl'),
  },

  roles: {
    Recruit: optional('DISCORD_ROLE_RECRUIT'),
    Driver:  optional('DISCORD_ROLE_DRIVER'),
    Senior:  optional('DISCORD_ROLE_SENIOR'),
    Elite:   optional('DISCORD_ROLE_ELITE'),
    Manager: optional('DISCORD_ROLE_MANAGER'),
    Owner:   optional('DISCORD_ROLE_OWNER'),
  },

  channels: {
    welcome:       optional('DISCORD_CHANNEL_WELCOME'),
    announcements: optional('DISCORD_CHANNEL_ANNOUNCEMENTS'),
  },
}

module.exports = config
