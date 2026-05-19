'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'


interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
}

interface LeadData {
  name?: string
  email?: string
  phone?: string
  interest?: string
  vaEligible?: boolean
  timeline?: string
  area?: string
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hey, I'm Alex. I work with Ryan. What brings you here?",
  id: 'initial',
}

export default function ChatWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false) // opens on desktop via useEffect
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [leadCaptured, setLeadCaptured] = useState(false)
  const [leadData, setLeadData] = useState<LeadData>({})
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Auto-open on desktop after 3s
  useEffect(() => {
    if (window.innerWidth >= 1024 && isOpen) {
      
    }
    if (window.innerWidth >= 1024) {
      const timer = setTimeout(() => setIsOpen(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, messages, scrollToBottom])

  // Show badge after 5s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) setHasNewMessage(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [isOpen])

  const handleOpen = () => {
    setIsOpen(true)
    setHasNewMessage(false)
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: Message = {
      role: 'user',
      content: text.trim(),
      id: Date.now().toString(),
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(({ role, content }) => ({ role, content })),
          pageUrl: window.location.href,
        }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply, id: (Date.now() + 1).toString() },
      ])

      if (data.leadCaptured && !leadCaptured) {
        setLeadCaptured(true)
        setLeadData(data.leadData || {})
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Something went wrong on my end. You can reach our team directly at hello@assumableguy.com.",
          id: (Date.now() + 1).toString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, leadCaptured])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  // Suppress on PPC and per-property landing pages
  if (pathname?.startsWith('/ppc') || pathname?.startsWith('/property')) return null

  // ── Panel positioning ──────────────────────────────────────────────
  // Mobile: full-screen overlay (avoids all keyboard/overflow issues)
  // Desktop: floating panel bottom-right
  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        borderRadius: 0,
        zIndex: 9999,
      }
    : {
        position: 'fixed',
        bottom: '84px',   // above the bubble button
        right: '20px',
        width: '360px',
        height: '520px',
        borderRadius: '20px',
        zIndex: 9999,
      }

  return (
    <>
      {/* ── Floating button (hidden on mobile when open) ── */}
      {!(isMobile && isOpen) && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
          {!isOpen ? (
            <button
              onClick={handleOpen}
              aria-label="Chat with us"
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#2563eb',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(37,99,235,0.5)',
                position: 'relative',
              }}
            >
              {hasNewMessage && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 20, height: 20, background: '#ef4444',
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff',
                }}>1</span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="26" height="26">
                <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd"/>
              </svg>
            </button>
          ) : null}
        </div>
      )}

      {/* ── Chat panel ── */}
      {isOpen && (
        <div
          style={{
            ...panelStyle,
            display: 'flex',
            flexDirection: 'column',
            background: '#f9fafb',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            border: '1px solid #e5e7eb',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.4)' }}>
                <Image src="/alex-avatar.jpg" alt="Alex" width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} priority />
              </div>
              <span style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 11, height: 11, background: '#4ade80',
                borderRadius: '50%', border: '2px solid #2563eb',
              }} />
            </div>

            {/* Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, lineHeight: '1.2' }}>Alex</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>The Assumable Guy Assistant</div>
            </div>

            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.8)', padding: 4, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: '50%',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: 8,
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', marginBottom: 2 }}>
                    <Image src="/alex-avatar.jpg" alt="Alex" width={28} height={28} style={{ objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{
                  maxWidth: '75%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  fontSize: 14,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  background: msg.role === 'user' ? '#2563eb' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#1f2937',
                  boxShadow: msg.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  border: msg.role === 'assistant' ? '1px solid #f0f0f0' : 'none',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing dots */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', overflow: 'hidden' }}>
                  <Image src="/alex-avatar.jpg" alt="Alex" width={28} height={28} style={{ objectFit: 'cover' }} />
                </div>
                <div style={{
                  background: '#fff', border: '1px solid #f0f0f0',
                  borderRadius: '18px 18px 18px 4px',
                  padding: '12px 16px',
                  display: 'flex', gap: 4, alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}>
                  {[0, 150, 300].map((d) => (
                    <span key={d} style={{
                      width: 7, height: 7, background: '#9ca3af',
                      borderRadius: '50%', display: 'inline-block',
                      animation: 'bounce 1.2s infinite',
                      animationDelay: `${d}ms`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Lead captured CTA */}
            {leadCaptured && (
              <div style={{
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 12, padding: 14, fontSize: 13,
              }}>
                <p style={{ fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>
                  Thanks{leadData.name ? `, ${leadData.name}` : ''}! Our team will be in touch soon.
                </p>
                <p style={{ color: '#3b82f6', marginBottom: 10, fontSize: 12 }}>
                  Want to skip the wait and book a call with a specialist?
                </p>
                <a
                  href="https://calendly.com/ryan-theassumableguy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    background: '#2563eb', color: '#fff',
                    fontSize: 12, fontWeight: 600,
                    padding: '8px 16px', borderRadius: 8,
                    textDecoration: 'none',
                  }}
                >
                  Book a Free 15-Min Call
                </a>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input row - always visible, never clipped */}
          <div style={{
            flexShrink: 0,
            background: '#fff',
            borderTop: '1px solid #e5e7eb',
            padding: '10px 12px',
            // On mobile, lift above iOS home indicator
            paddingBottom: isMobile ? 'max(10px, env(safe-area-inset-bottom))' : '10px',
          }}>
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(input) } }}
                placeholder="Type a message..."
                disabled={isLoading}
                autoComplete="off"
                style={{
                  flex: 1,
                  minWidth: 0,            /* critical - prevents overflow */
                  height: 44,
                  borderRadius: 22,
                  border: '1.5px solid #d1d5db',
                  padding: '0 16px',
                  fontSize: 15,
                  outline: 'none',
                  background: '#f9fafb',
                  color: '#111827',
                  WebkitAppearance: 'none',
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                aria-label="Send"
                style={{
                  flexShrink: 0,
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: input.trim() && !isLoading ? '#2563eb' : '#d1d5db',
                  border: 'none',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" width="18" height="18">
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bounce keyframe for typing dots */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  )
}
