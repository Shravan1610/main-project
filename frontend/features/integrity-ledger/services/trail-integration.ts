import { IntegrityEvent } from "../types/integrity-events.types"

const trailEvents: IntegrityEvent[] = []

export function pushTrailEvent(event: IntegrityEvent) {

  trailEvents.push(event)

  console.log("Digital Trail Event:", event)

}

export function getTrailEvents() {

  return trailEvents

}