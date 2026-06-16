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
      <div className="flex w-12 flex-col items-center border-r border-[var(--color-border)] bg-[var(--color-surface-1)] py-3">
        <button
          onClick={() => setCollapsed(false)}
          className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-secondary)]"
          title="Expand sidebar"
        >
          <ChevronLeft className="h-5 w-5 rotate-180" />
        </button>
        <button
          onClick={handleNewChat}
          className="mt-3 rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
          title="New chat"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-1)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[var(--color-accent)]" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Sessions</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewChat}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {sessions.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-[var(--color-text-muted)]">
            No sessions yet. Start a new chat.
          </p>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelect(session.id)}
              className={`group mb-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                session.id === activeSessionId
                  ? 'bg-[var(--color-surface-3)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <span className="flex-1 truncate">{session.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(session.id)
                }}
                className="rounded p-0.5 text-[var(--color-text-muted)] opacity-0 transition-opacity hover:bg-[var(--color-surface-0)] hover:text-[var(--color-error)] group-hover:opacity-100"
                title="Delete session"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--color-border)] px-3 py-3">
        {providerName && (
          <p className="mb-2 text-xs text-[var(--color-text-muted)]">
            Using <span className="font-medium text-[var(--color-text-secondary)]">{providerName}</span>
            {currentConfig && (
              <> — <code className="rounded bg-[var(--color-surface-2)] px-1 py-0.5 text-[11px]">{currentConfig.model}</code></>
            )}
          </p>
        )}
        <button
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-secondary)]"
        >
          <Settings className="h-3.5 w-3.5" />
          Change Provider
        </button>
      </div>
    </div>
  )
}
