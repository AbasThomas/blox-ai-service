"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface HexagonBackgroundProps {
  className?: string
  children?: React.ReactNode
  /** Base hexagon width in pixels */
  hexagonSize?: number
  /** Gap between hexagons in pixels */
  hexagonMargin?: number
  /** Mouse proximity radius for highlighting */
  proximity?: number
  /** Glow color on hover */
  glowColor?: string
  /** Base border color */
  borderColor?: string
}

export function HexagonBackground({
  className,
  children,
  hexagonSize = 60,
  hexagonMargin = 2,
  proximity = 140,
  glowColor = "rgba(30, 206, 250, 0.4)",
  borderColor = "rgba(63, 63, 70, 0.3)",
}: HexagonBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [grid, setGrid] = useState({ rows: 0, cols: 0, scale: 1 })
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })

  const hexWidth = hexagonSize
  const hexHeight = hexagonSize * 1.15
  const rowSpacing = hexagonSize * 0.86

  const updateGrid = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const { width, height } = container.getBoundingClientRect()
    const scale = Math.max(1, Math.min(width, height) / 800)
    const scaledSize = hexagonSize * scale

    const cols = Math.ceil(width / scaledSize) + 2
    const rows = Math.ceil(height / (scaledSize * 0.86)) + 2

    setGrid({ rows, cols, scale })
  }, [hexagonSize])

  useEffect(() => {
    updateGrid()
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver(updateGrid)
    ro.observe(container)
    return () => ro.disconnect()
  }, [updateGrid])

  const updateMousePosition = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const localX = clientX - rect.left
    const localY = clientY - rect.top

    if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) {
      setMousePos({ x: -1000, y: -1000 })
      return
    }

    setMousePos({ x: localX, y: localY })
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      updateMousePosition(e.clientX, e.clientY)
    }

    const onMouseLeave = () => {
      setMousePos({ x: -1000, y: -1000 })
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseleave", onMouseLeave)

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseleave", onMouseLeave)
    }
  }, [updateMousePosition])

  const scaledHexWidth = hexWidth * grid.scale
  const scaledHexHeight = hexHeight * grid.scale
  const scaledRowSpacing = rowSpacing * grid.scale
  const scaledMargin = hexagonMargin * grid.scale
  const scaledProximity = proximity * grid.scale

  const withAlpha = useCallback((color: string, alpha: number) => {
    const safeAlpha = Math.max(0, Math.min(1, alpha))

    if (color.startsWith("rgba(")) {
      return color.replace(/[\d.]+\)\s*$/, `${safeAlpha})`)
    }

    if (color.startsWith("rgb(")) {
      return color.replace("rgb(", "rgba(").replace(")", `, ${safeAlpha})`)
    }

    const hex = color.replace("#", "")
    if (hex.length === 6) {
      const r = Number.parseInt(hex.slice(0, 2), 16)
      const g = Number.parseInt(hex.slice(2, 4), 16)
      const b = Number.parseInt(hex.slice(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`
    }

    return color
  }, [])

  const hexagonStyle = useMemo(
    () => ({
      width: scaledHexWidth,
      height: scaledHexHeight,
      marginLeft: scaledMargin,
      "--glow-color": glowColor,
      "--border-color": borderColor,
      "--margin": `${scaledMargin}px`,
    }),
    [scaledHexWidth, scaledHexHeight, scaledMargin, glowColor, borderColor],
  )

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 overflow-hidden bg-[#0C0F13]", className)}
    >
      {/* Hexagon grid */}
      <div className="absolute inset-0 overflow-hidden opacity-50">
        {Array.from({ length: grid.rows }).map((_, rowIndex) => {
          const isOddRow = rowIndex % 2 === 1
          const marginLeft = isOddRow ? -(scaledHexWidth / 2) + scaledMargin : scaledMargin

          return (
            <div
              key={rowIndex}
              className="flex"
              style={{
                marginTop: rowIndex === 0 ? -scaledHexHeight * 0.25 : -scaledRowSpacing * 0.16,
                marginLeft: marginLeft - scaledHexWidth * 0.1,
              }}
            >
              {Array.from({ length: grid.cols }).map((_, colIndex) => (
                (() => {
                  const centerX =
                    colIndex * (scaledHexWidth + scaledMargin) +
                    (isOddRow ? scaledHexWidth * 0.5 : 0) +
                    scaledHexWidth * 0.45
                  const centerY = rowIndex * scaledRowSpacing + scaledHexHeight * 0.3

                  const dx = mousePos.x - centerX
                  const dy = mousePos.y - centerY
                  const distance = Math.sqrt(dx * dx + dy * dy)
                  const proximityFactor = Math.max(0, 1 - distance / scaledProximity)

                  const dynamicBorder =
                    proximityFactor > 0
                      ? withAlpha(glowColor, 0.2 + proximityFactor * 0.65)
                      : borderColor
                  const dynamicFill =
                    proximityFactor > 0
                      ? withAlpha("#161B22", 0.9 + proximityFactor * 0.1)
                      : "#0C0F13"
                  const dynamicShadow =
                    proximityFactor > 0
                      ? `0 0 ${10 + 24 * proximityFactor}px ${withAlpha(glowColor, 0.25 + proximityFactor * 0.45)}`
                      : "none"

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={cn(
                        "relative shrink-0 transition-all duration-500",
                        "[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]",
                        "before:absolute before:inset-0 before:bg-[var(--dynamic-border)]",
                        "before:shadow-[var(--dynamic-shadow)] before:transition-all before:duration-500",
                        "after:absolute after:inset-[var(--margin)] after:bg-[var(--dynamic-fill)]",
                        "after:[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]",
                        "after:transition-all after:duration-300",
                      )}
                      style={
                        {
                          ...hexagonStyle,
                          "--dynamic-border": dynamicBorder,
                          "--dynamic-fill": dynamicFill,
                          "--dynamic-shadow": dynamicShadow,
                        } as React.CSSProperties
                      }
                    />
                  )
                })()
              ))}
            </div>
          )
        })}
      </div>

      {/* Ambient glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, rgba(30,206,250,0.15) 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 80%, rgba(30,206,250,0.1) 0%, transparent 50%)`,
        }}
      />

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(12,15,19,0.85) 100%)",
        }}
      />

      {/* Content layer */}
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  )
}
