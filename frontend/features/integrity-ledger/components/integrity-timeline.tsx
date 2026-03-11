"use client"

interface Event {
  type: string
  timestamp: number
}

interface Props {
  events: Event[]
}

export default function IntegrityTimeline({ events }: Props) {

  return (

    <div className="rounded border border-terminal-border bg-terminal-surface p-4 text-terminal-text">

      <h3 className="font-semibold mb-3">
        Integrity Timeline
      </h3>

      <div className="space-y-3">

        {events.map((e, index) => (

          <div key={index} className="flex justify-between text-sm">

            <span>{e.type}</span>

            <span className="text-terminal-text-dim">
              {new Date(e.timestamp).toLocaleTimeString()}
            </span>

          </div>

        ))}

      </div>

    </div>

  )
}
