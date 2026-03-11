"use client"

interface Props {
  tampered: boolean
}

export default function TamperAlert({ tampered }: Props) {

  if (!tampered) return null

  return (

    <div className="rounded border border-terminal-red/35 bg-terminal-red/10 p-4">

      <h4 className="font-semibold text-terminal-red">
        Tampering Detected
      </h4>

      <p className="mt-1 text-sm text-terminal-red">
        Document content changed after verification.
      </p>

    </div>

  )
}
