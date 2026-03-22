'use strict'

const RANK_ORDER = ['Recruit', 'Driver', 'Senior', 'Elite', 'Manager', 'Owner']

const RANK_EMOJI = {
  Owner:   '👑',
  Manager: '🛡️',
  Elite:   '💎',
  Senior:  '⭐',
  Driver:  '🚛',
  Recruit: '🔰',
}

const RANK_COLOR = {
  Owner:   0xF59E0B,
  Manager: 0xEF4444,
  Elite:   0xA855F7,
  Senior:  0x3B82F6,
  Driver:  0x22C55E,
  Recruit: 0x71717A,
}

const COLORS = {
  amber:   0xF59E0B,
  green:   0x22C55E,
  red:     0xEF4444,
  blue:    0x3B82F6,
  purple:  0xA855F7,
  zinc:    0x52525B,
  orange:  0xF97316,
}

const PERIOD_LABEL = {
  week:  'ten tydzień',
  month: 'ten miesiąc',
  all:   'cały czas',
}

module.exports = { RANK_ORDER, RANK_EMOJI, RANK_COLOR, COLORS, PERIOD_LABEL }
