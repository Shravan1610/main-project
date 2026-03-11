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

    <div className="p-4 bg-slate-900 rounded border border-slate-700">

      <h3 className="font-semibold mb-3">
        Integrity Timeline
      </h3>

      <div className="space-y-3">

        {events.map((e, index) => (

          <div key={index} className="flex justify-between text-sm">

            <span>{e.type}</span>

            <span className="text-gray-400">
              {new Date(e.timestamp).toLocaleTimeString()}
            </span>

          </div>

        ))}

      </div>

    </div>

  )
}