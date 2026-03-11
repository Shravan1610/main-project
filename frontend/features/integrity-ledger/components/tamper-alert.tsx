"use client"

interface Props {
  tampered: boolean
}

export default function TamperAlert({ tampered }: Props) {

  if (!tampered) return null

  return (

    <div className="p-4 bg-red-900 border border-red-600 rounded">

      <h4 className="font-semibold text-red-300">
        Tampering Detected
      </h4>

      <p className="text-sm text-red-200 mt-1">
        Document content changed after verification.
      </p>

    </div>

  )
}