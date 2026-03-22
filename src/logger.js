'use strict'

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  amber:  '\x1b[33m',
  blue:   '\x1b[34m',
  purple: '\x1b[35m',
}

const LEVELS = {
  INFO:  { color: C.cyan,   label: ' INFO ' },
  OK:    { color: C.green,  label: '  OK  ' },
  WARN:  { color: C.yellow, label: ' WARN ' },
  ERROR: { color: C.red,    label: ' ERR  ' },
  CMD:   { color: C.purple, label: ' CMD  ' },
  EVENT: { color: C.blue,   label: ' EVT  ' },
}

function log(level, message, meta = null) {
  const { color, label } = LEVELS[level] ?? LEVELS.INFO
  const ts = new Date().toLocaleTimeString('pl-PL', { hour12: false })

  let line = `${C.dim}[${ts}]${C.reset} ${color}${C.bold}${label}${C.reset} ${message}`

  if (meta) {
    line += ` ${C.dim}${JSON.stringify(meta)}${C.reset}`
  }

  console.log(line)
}

const logger = {
  info:  (msg, meta) => log('INFO',  msg, meta),
  ok:    (msg, meta) => log('OK',    msg, meta),
  warn:  (msg, meta) => log('WARN',  msg, meta),
  error: (msg, meta) => log('ERROR', msg, meta),
  cmd:   (msg, meta) => log('CMD',   msg, meta),
  event: (msg, meta) => log('EVENT', msg, meta),

  // Separator wizualny
  divider: () => console.log(`${C.dim}${'─'.repeat(50)}${C.reset}`),

  // Banner startowy
  banner: () => {
    console.clear()
    console.log(`
${C.amber}${C.bold}  ╔══════════════════════════════════════════════╗
  ║       GLos Logistics Bot  v2.0.0            ║
  ║       discord.js v14  •  Supabase           ║
  ╚══════════════════════════════════════════════╝${C.reset}
`)
  },
}

module.exports = logger
