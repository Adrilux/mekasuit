"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Bot, Send, Trash2, User } from "lucide-react"

type Message = {
  role: "user" | "assistant"
  content: string
}

const WELCOME: Message = {
  role: "assistant",
  content:
    "Bonjour ! Je suis votre assistant GMAO. Je peux vous aider à :\n\n" +
    "- **Diagnostiquer des pannes** machines\n" +
    "- **Préparer des interventions** préventives\n" +
    "- **Rédiger des rapports** techniques\n" +
    "- **Analyser des historiques** de maintenance\n\n" +
    "Comment puis-je vous aider ?",
}

function formatContent(text: string) {
  // Simple markdown-like rendering: bold (**text**), bullet points, newlines
  const parts = text.split("\n").map((line, i) => {
    const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    if (line.startsWith("- ")) {
      return (
        <li
          key={i}
          className="ml-4 list-disc"
          dangerouslySetInnerHTML={{ __html: formatted.slice(2) }}
        />
      )
    }
    if (!line.trim()) return <br key={i} />
    return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
  })

  const result: React.ReactNode[] = []
  let inList = false
  let listItems: React.ReactNode[] = []

  text.split("\n").forEach((line, i) => {
    const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    if (line.startsWith("- ")) {
      inList = true
      listItems.push(
        <li
          key={i}
          className="ml-4 list-disc"
          dangerouslySetInnerHTML={{ __html: formatted.slice(2) }}
        />
      )
    } else {
      if (inList) {
        result.push(<ul key={`ul-${i}`} className="my-1">{listItems}</ul>)
        listItems = []
        inList = false
      }
      if (!line.trim()) {
        result.push(<br key={i} />)
      } else {
        result.push(<p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />)
      }
    }
  })
  if (inList && listItems.length > 0) {
    result.push(<ul key="ul-end" className="my-1">{listItems}</ul>)
  }

  return <div className="space-y-0.5">{result}</div>
}

export function AiChatClient() {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: "user", content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    // Placeholder for streaming response
    const assistantMsg: Message = { role: "assistant", content: "" }
    setMessages([...newMessages, assistantMsg])

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.filter((m) => m.role !== "assistant" || m.content).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        setMessages([...newMessages, { role: "assistant", content: `Erreur : ${err}` }])
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          setMessages([...newMessages, { role: "assistant", content: accumulated }])
        }
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Erreur de connexion. Veuillez réessayer." }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([WELCOME])
    setInput("")
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-2rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-900">Assistant IA</h1>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">GMAO</span>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Effacer
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "assistant"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {msg.role === "assistant" ? (
                <Bot className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-white border border-slate-200 text-slate-800"
                  : "bg-blue-600 text-white"
              }`}
            >
              {msg.role === "assistant" ? (
                msg.content ? (
                  formatContent(msg.content)
                ) : (
                  <span className="flex gap-1 items-center text-slate-400">
                    <span className="animate-bounce">·</span>
                    <span className="animate-bounce [animation-delay:0.15s]">·</span>
                    <span className="animate-bounce [animation-delay:0.3s]">·</span>
                  </span>
                )
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Décrivez une panne, posez une question technique… (Entrée pour envoyer)"
          rows={2}
          disabled={loading}
          className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={() => void sendMessage()}
          disabled={loading || !input.trim()}
          className="h-11 w-11 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-1.5 text-center">
        Shift+Entrée pour un saut de ligne · Propulsé par Llama 3.3 via Groq
      </p>
    </div>
  )
}
