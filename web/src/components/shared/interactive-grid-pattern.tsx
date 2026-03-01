"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface InteractiveGridPatternProps {
  className?: string
  children?: React.ReactNode
  /** Size of each grid cell in pixels */
  cellSize?: number
  /** Whether to scale the grid based on viewport size */
  responsiveScale?: boolean
  /** Glow color on hover */
  glowColor?: string
  /** Border color of grid lines */
  borderColor?: string
  /** Mouse proximity radius for subtle highlighting */
  proximity?: number
}

export function InteractiveGridPattern({
  className,
  children,
  cellSize = 50,
  responsiveScale = true,
  glowColor = "rgba(34, 211, 238, 0.4)",
  borderColor = "rgba(63, 63, 70, 0.4)",
  proximity = 100,
}: InteractiveGridPatternProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [grid, setGrid] = useState({ rows: 0, cols: 0, scale: 1 })
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })

  const updateGrid = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const { width, height } = container.getBoundingClientRect()
    const scale = responsiveScale ? Math.max(1, Math.min(width, height) / 800) : 1
    const scaledCellSize = cellSize * scale

    const cols = Math.ceil(width / scaledCellSize) + 1
    const rows = Math.ceil(height / scaledCellSize) + 1

    setGrid({ rows, cols, scale })
  }, [cellSize, responsiveScale])

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

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    updateMousePosition(e.clientX, e.clientY)
  }, [updateMousePosition])

  useEffect(() => {
    const onWindowMouseMove = (e: MouseEvent) => {
      updateMousePosition(e.clientX, e.clientY)
    }

    const onWindowMouseLeave = () => {
      setMousePos({ x: -1000, y: -1000 })
    }

    window.addEventListener("mousemove", onWindowMouseMove)
    window.addEventListener("mouseleave", onWindowMouseLeave)

    return () => {
      window.removeEventListener("mousemove", onWindowMouseMove)
      window.removeEventListener("mouseleave", onWindowMouseLeave)
    }
  }, [updateMousePosition])

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: -1000, y: -1000 })
  }, [])

  const scaledCellSize = cellSize * grid.scale
  const scaledProximity = proximity * grid.scale
  const hoveredCell =
    mousePos.x < 0 || mousePos.y < 0
      ? null
      : Math.floor(mousePos.y / scaledCellSize) * grid.cols + Math.floor(mousePos.x / scaledCellSize)

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{ backgroundColor: "#020612" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Grid */}
      <div className="absolute inset-0">
        {Array.from({ length: grid.rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex">
            {Array.from({ length: grid.cols }).map((_, colIndex) => {
              const index = rowIndex * grid.cols + colIndex
              const cellX = colIndex * scaledCellSize + scaledCellSize / 2
              const cellY = rowIndex * scaledCellSize + scaledCellSize / 2
              const dx = mousePos.x - cellX
              const dy = mousePos.y - cellY
              const distance = Math.sqrt(dx * dx + dy * dy)
              const proximityFactor = Math.max(0, 1 - distance / scaledProximity)
              const isHovered = hoveredCell === index

              return (
                <div
                  key={index}
                  className="shrink-0 border transition-all duration-1000 ease-out"
                  style={{
                    width: scaledCellSize,
                    height: scaledCellSize,
                    borderColor: borderColor,
                    backgroundColor: isHovered
                      ? glowColor
                      : proximityFactor > 0
                        ? glowColor.replace(/[\d.]+\)$/, `${proximityFactor * 0.15})`)
                        : "transparent",
                    boxShadow: isHovered
                      ? `0 0 ${20 * grid.scale}px ${glowColor}, inset 0 0 ${10 * grid.scale}px ${glowColor.replace(/[\d.]+\)$/, "0.2)")}`
                      : "none",
                    transitionDuration: isHovered ? "0ms" : "1000ms",
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Center ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
        style={{
          width: "60vmin",
          height: "60vmin",
          background: `radial-gradient(circle, ${glowColor.replace(/[\d.]+\)$/, "0.3)")} 0%, transparent 70%)`,
        }}
      />

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(2,6,18,0.9) 100%)",
        }}
      />

      {/* Top blur fade */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        style={{
          background: "linear-gradient(to bottom, #020612 0%, transparent 100%)",
        }}
      />

      {/* Bottom blur fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{
          background: "linear-gradient(to top, #020612 0%, transparent 100%)",
        }}
      />

      {/* Content layer */}
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  )
}
