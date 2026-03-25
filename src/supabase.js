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

// ─── Members ─────────────────────────────────
async function getMemberByDiscordId(discordId) {
  const { data, error } = await supabase
    .from('members')
    .select('id, username, rank, points, avatar_url, joined_at, is_banned, truckershub_id, discord_id, steam_id, truckersmp_id')
    .eq('discord_id', discordId)
    .maybeSingle()

  if (error) logger.error('getMemberByDiscordId', { discordId, error: error.message })
  return data ?? null
}

async function getMemberByUsername(username) {
  const { data, error } = await supabase
    .from('members')
    .select('id, username, rank, points, avatar_url, joined_at, is_banned, discord_id, steam_id')
    .ilike('username', username)
    .maybeSingle()

  if (error) logger.error('getMemberByUsername', { username, error: error.message })
  return data ?? null
}

// ─── Stats ────────────────────────────────────
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
    cleanJobs: jobs.filter(j => (j.damage_percent ?? 0) === 0).length,
  }
}

// ─── Ranking ──────────────────────────────────
async function getTopMembers(limit = 10, period = 'week') {
  const periodFrom = period === 'week'
    ? new Date(Date.now() - 7  * 86_400_000).toISOString()
    : period === 'month'
    ? new Date(Date.now() - 30 * 86_400_000).toISOString()
    : new Date(0).toISOString()

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('member_id, distance_km, income, damage_percent')
    .eq('status', 'completed')
    .gte('completed_at', periodFrom)

  if (error) { logger.error('getTopMembers', { error: error.message }); return [] }

  // Agreguj per member
  const map = {}
  for (const j of jobs ?? []) {
    if (!map[j.member_id]) map[j.member_id] = { distance: 0, income: 0, jobs: 0, damage: 0 }
    map[j.member_id].distance += j.distance_km  ?? 0
    map[j.member_id].income   += j.income        ?? 0
    map[j.member_id].jobs     += 1
    map[j.member_id].damage   += j.damage_percent ?? 0
  }

  const memberIds = Object.keys(map)
  if (!memberIds.length) return []

  const { data: members } = await supabase
    .from('members')
    .select('id, username, rank, points, discord_id')
    .in('id', memberIds)
    .eq('is_banned', false)

  return (members ?? [])
    .map(m => ({ ...m, stats: map[m.id] }))
    .sort((a, b) => b.stats.distance - a.stats.distance)
    .slice(0, limit)
}

// ─── Applications ─────────────────────────────
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

// ─── Members management ───────────────────────
async function updateMemberRank(memberId, newRank) {
  const { error } = await supabase
    .from('members')
    .update({ rank: newRank })
    .eq('id', memberId)

  if (error) logger.error('updateMemberRank', { memberId, error: error.message })
  return !error
}

async function banMember(memberId, reason, bannedBy) {
  const { error } = await supabase
    .from('members')
    .update({
      is_banned:  true,
      ban_reason: reason ?? null,
      banned_at:  new Date().toISOString(),
      banned_by:  bannedBy ?? null,
    })
    .eq('id', memberId)

  if (error) logger.error('banMember', { memberId, error: error.message })
  return !error
}

async function unbanMember(memberId) {
  const { error } = await supabase
    .from('members')
    .update({
      is_banned:  false,
      ban_reason: null,
      banned_at:  null,
      banned_by:  null,
    })
    .eq('id', memberId)

  if (error) logger.error('unbanMember', { memberId, error: error.message })
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

// ─── Leaves ───────────────────────────────────
async function getMemberLeaves(memberId) {
  const { data, error } = await supabase
    .from('member_leaves')
    .select('id, type, status, start_date, end_date, reason, admin_note, created_at')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) logger.error('getMemberLeaves', { memberId, error: error.message })
  return data ?? []
}

async function getActiveLeaves() {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('member_leaves')
    .select('id, type, start_date, end_date, member_id')
    .in('status', ['approved', 'active'])
    .lte('start_date', today)
    .gte('end_date',   today)

  if (error) logger.error('getActiveLeaves', { error: error.message })
  return data ?? []
}

module.exports = {
  supabase,
  getMemberByDiscordId,
  getMemberByUsername,
  getMemberStats,
  getTopMembers,
  getPendingApplications,
  updateApplicationStatus,
  updateMemberRank,
  banMember,
  unbanMember,
  linkDiscordAccount,
  getMemberLeaves,
  getActiveLeaves,
}
