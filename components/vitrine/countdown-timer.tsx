"use client"

import { useEffect, useState } from "react"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(target: number): TimeLeft {
  const difference = target - Date.now()
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/15 backdrop-blur-sm text-white font-bold text-3xl md:text-5xl w-16 h-16 md:w-24 md:h-24 rounded-xl flex items-center justify-center shadow-lg border border-white/20">
        {String(value).padStart(2, "0")}
      </div>
      <span className="text-white/80 text-xs md:text-sm mt-2 uppercase tracking-wider">{label}</span>
    </div>
  )
}

/** Compte à rebours jusqu'à un instant (ISO). */
export function CountdownTimer({ target, label }: { target: string; label?: string }) {
  const targetMs = new Date(target).getTime()
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(targetMs))
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft(targetMs)), 1000)
    return () => clearInterval(timer)
  }, [targetMs])

  const values = timeLeft ?? { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return (
    <div className="space-y-3">
      {label && <p className="text-white/80 text-sm uppercase tracking-widest font-bold">{label}</p>}
      <div className="flex gap-3 md:gap-6 justify-center">
        <TimeBlock value={values.days} label="Jours" />
        <TimeBlock value={values.hours} label="Heures" />
        <TimeBlock value={values.minutes} label="Minutes" />
        <TimeBlock value={values.seconds} label="Secondes" />
      </div>
    </div>
  )
}
