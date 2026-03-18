"use client"

import { useEffect, useState } from "react"
import { EVENT_DATE } from "@/lib/vitrine/data"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(): TimeLeft {
  const difference = EVENT_DATE.getTime() - Date.now()
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

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!timeLeft) {
    return (
      <div className="flex gap-3 md:gap-6 justify-center">
        {["Jours", "Heures", "Minutes", "Secondes"].map((label) => (
          <TimeBlock key={label} value={0} label={label} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-3 md:gap-6 justify-center">
      <TimeBlock value={timeLeft.days} label="Jours" />
      <TimeBlock value={timeLeft.hours} label="Heures" />
      <TimeBlock value={timeLeft.minutes} label="Minutes" />
      <TimeBlock value={timeLeft.seconds} label="Secondes" />
    </div>
  )
}
