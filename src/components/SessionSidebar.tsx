import { useState } from 'react'
import type { ChatSession } from '../chat/types'
import type { ProviderConfig } from '../providers/types'
import { getProvider } from '../providers'
import { Plus, MessageSquare, Trash2, Settings, ChevronLeft } from 'lucide-react'

interface Props {
  sessions: ChatSession[]
  activeSessionId: string | null
  onSelect: (id: string) => void
  onNew: (config: ProviderConfig) => ChatSession
  onDelete: (id: string) => void
  onOpenSettings: () => void
  currentConfig: ProviderConfig | null
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onNew,
  onDelete,
  onOpenSettings,
  currentConfig,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const handleNewChat = () => {
    if (currentConfig) {
      onNew(currentConfig)
    } else {
      onOpenSettings()
    }
  }

  const providerName = currentConfig
    ? getProvider(currentConfig.providerId)?.name ?? currentConfig.providerId
    : null

  if (collapsed) {
    return (
      <div className="flex w-12 flex-col items-center border-r border-cream-border bg-cream-light py-3">
        <button
          onClick={() => setCollapsed(false)}
          className="rounded-doodle p-2 text-ink-muted hover:bg-cream-soft hover:text-ink-soft"
          title="Expand sidebar"
        >
          <ChevronLeft className="h-5 w-5 rotate-180" />
        </button>
        <button
          onClick={handleNewChat}
          className="mt-3 rounded-doodle p-2 text-ink-muted hover:bg-cream-soft hover:text-ink"
          title="New chat"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex w-64 flex-col border-r border-cream-border bg-cream-light">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cream-border px-3 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-accent" />
          <span className="font-display text-sm font-semibold tracking-tight text-ink">Sessions</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewChat}
            className="rounded-doodle p-1.5 text-ink-muted hover:bg-cream-soft hover:text-ink"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="rounded-doodle p-1.5 text-ink-muted hover:bg-cream-soft"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {sessions.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-ink-muted">
            No sessions yet. Start a new chat.
          </p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(session.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(session.id)
                }
              }}
              className={`group mb-0.5 flex w-full items-center gap-2 rounded-doodle px-3 py-2 text-left text-sm transition-colors cursor-pointer select-none ${
                session.id === activeSessionId
                  ? 'bg-accent/8 text-ink border border-accent/20'
                  : 'text-ink-soft hover:bg-cream-soft hover:text-ink border border-transparent'
              }`}
            >
              <span className="flex-1 truncate">{session.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(session.id)
                }}
                className="rounded p-0.5 text-ink-muted opacity-0 transition-opacity hover:bg-cream-border/60 hover:text-danger group-hover:opacity-100"
                title="Delete session"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-cream-border px-3 py-3">
        {providerName && (
          <p className="mb-2 text-xs text-ink-muted">
            Using <span className="font-medium text-ink-soft">{providerName}</span>
            {currentConfig && (
              <> — <code className="rounded bg-cream-soft px-1 py-0.5 text-[11px] text-accent-hover">{currentConfig.model}</code></>
            )}
          </p>
        )}
        <button
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2 rounded-doodle px-2 py-1.5 text-xs text-ink-muted transition-colors hover:bg-cream-soft hover:text-ink-soft"
        >
          <Settings className="h-3.5 w-3.5" />
          Change Provider
        </button>
      </div>
    </div>
  )
}
