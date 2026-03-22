'use strict'

const { createClient } = require('@supabase/supabase-js')
const config           = require('./config')
const logger           = require('./logger')

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: { persistSession: false },
    global: {
      headers: { 'x-application-name': 'glos-logistics-bot' },
    },
  }
)

// ─── Wrappers z logowaniem ───────────────────
async function getMemberByDiscordId(discordId) {
  const { data, error } = await supabase
    .from('members')
    .select('id, username, rank, points, avatar_url, joined_at, is_banned, truckershub_id, discord_id')
    .eq('discord_id', discordId)
    .maybeSingle()

  if (error) logger.error('getMemberByDiscordId', { discordId, error: error.message })
  return data ?? null
}

async function getMemberByUsername(username) {
  const { data, error } = await supabase
    .from('members')
    .select('id, username, rank, points, avatar_url, joined_at, is_banned, discord_id')
    .ilike('username', username)
    .maybeSingle()

  if (error) logger.error('getMemberByUsername', { username, error: error.message })
  return data ?? null
}

async function getMemberStats(memberId, period = 'week') {
  const periodFrom = period === 'week'
    ? new Date(Date.now() - 7  * 86_400_000).toISOString()
    : period === 'month'
    ? new Date(Date.now() - 30 * 86_400_000).toISOString()
    : new Date(0).toISOString()

  const { data, error } = await supabase
    .from('jobs')
    .select('distance_km, income, damage_percent, fuel_used, completed_at')
    .eq('member_id', memberId)
    .eq('status', 'completed')
    .gte('completed_at', periodFrom)

  if (error) logger.error('getMemberStats', { memberId, error: error.message })

  const jobs = data ?? []
  return {
    jobCount:      jobs.length,
    totalDistance: jobs.reduce((s, j) => s + (j.distance_km ?? 0), 0),
    totalIncome:   jobs.reduce((s, j) => s + (j.income      ?? 0), 0),
    totalFuel:     jobs.reduce((s, j) => s + (j.fuel_used   ?? 0), 0),
    avgDamage:     jobs.length
      ? jobs.reduce((s, j) => s + (j.damage_percent ?? 0), 0) / jobs.length
      : 0,
    cleanJobs:     jobs.filter(j => (j.damage_percent ?? 0) === 0).length,
  }
}

async function getPendingApplications(limit = 10) {
  const { data, error } = await supabase
    .from('applications')
    .select('id, username, discord_tag, ets2_hours, motivation, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) logger.error('getPendingApplications', { error: error.message })
  return data ?? []
}

async function updateApplicationStatus(id, status, reviewedBy) {
  const { error } = await supabase
    .from('applications')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
    })
    .eq('id', id)

  if (error) logger.error('updateApplicationStatus', { id, error: error.message })
  return !error
}

async function updateMemberRank(memberId, newRank) {
  const { error } = await supabase
    .from('members')
    .update({ rank: newRank })
    .eq('id', memberId)

  if (error) logger.error('updateMemberRank', { memberId, error: error.message })
  return !error
}

async function linkDiscordAccount(memberId, discordId) {
  const { error } = await supabase
    .from('members')
    .update({ discord_id: discordId })
    .eq('id', memberId)

  if (error) logger.error('linkDiscordAccount', { memberId, error: error.message })
  return !error
}

module.exports = {
  supabase,
  getMemberByDiscordId,
  getMemberByUsername,
  getMemberStats,
  getPendingApplications,
  updateApplicationStatus,
  updateMemberRank,
  linkDiscordAccount,
}
