interface StarChartProps {
  data: Array<{
    dimension: string
    value: number
    max: number
  }>
  size?: 'small' | 'large'
}

export default function StarChart({ data, size = 'large' }: StarChartProps) {
  const isSmall = size === 'small'

  return (
    <div className="relative mx-auto aspect-square w-full">
      <svg viewBox="-10 -10 340 340" className="h-full w-full">
        {/* Center point */}
        <circle cx="160" cy="160" r="3" fill="#4f46e5" />

        {/* Concentric circles */}
        {[32, 64, 96, 128, 160].map((radius) => (
          <circle
            key={radius}
            cx="160"
            cy="160"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="stroke-gray-300 dark:stroke-gray-600"
          />
        ))}

        {/* Scale labels (0, 5, 10) straight up from center */}
        {[0, 5, 10].map((val) => (
          <text
            key={val}
            x="160"
            y={160 - val * 16 - (val === 0 ? 12 : 0) + 5}
            textAnchor="middle"
            fontSize="14"
            fontWeight="500"
            fill="currentColor"
            className="fill-gray-600 dark:fill-gray-400"
          >
            {val}
          </text>
        ))}

        {/* Axes */}
        {data.map((_, idx) => {
          const angle = (idx * (360 / data.length) - 90 + 30) * (Math.PI / 180)
          const x = 160 + 160 * Math.cos(angle)
          const y = 160 + 160 * Math.sin(angle)
          return (
            <line
              key={idx}
              x1="160"
              y1="160"
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeWidth="1"
              className="stroke-gray-300 dark:stroke-gray-600"
            />
          )
        })}

        {/* Filled area with curved star shape */}
        <path
          d={(() => {
            const pathSegments = data.map((item, idx) => {
              const angle =
                (idx * (360 / data.length) - 90 + 30) * (Math.PI / 180)
              const length = item.value * 16
              const x = 160 + length * Math.cos(angle)
              const y = 160 + length * Math.sin(angle)

              if (idx === 0) {
                return `M ${x} ${y}`
              }

              // Get previous point
              const prevAngle =
                ((idx - 1) * (360 / data.length) - 90 + 30) * (Math.PI / 180)
              const prevLength = data[idx - 1].value * 16
              const prevX = 160 + prevLength * Math.cos(prevAngle)
              const prevY = 160 + prevLength * Math.sin(prevAngle)

              // Calculate control point (0.6 = gentle curve)
              const midX = (prevX + x) / 2
              const midY = (prevY + y) / 2
              const controlX = 160 + (midX - 160) * 0.6
              const controlY = 160 + (midY - 160) * 0.6

              return `Q ${controlX} ${controlY} ${x} ${y}`
            })

            // Add closing curve from last point back to first
            const lastIdx = data.length - 1
            const lastAngle =
              (lastIdx * (360 / data.length) - 90 + 30) * (Math.PI / 180)
            const lastLength = data[lastIdx].value * 16
            const lastX = 160 + lastLength * Math.cos(lastAngle)
            const lastY = 160 + lastLength * Math.sin(lastAngle)

            const firstAngle =
              (0 * (360 / data.length) - 90 + 30) * (Math.PI / 180)
            const firstLength = data[0].value * 16
            const firstX = 160 + firstLength * Math.cos(firstAngle)
            const firstY = 160 + firstLength * Math.sin(firstAngle)

            const closingMidX = (lastX + firstX) / 2
            const closingMidY = (lastY + firstY) / 2
            const closingControlX = 160 + (closingMidX - 160) * 0.6
            const closingControlY = 160 + (closingMidY - 160) * 0.6

            return (
              pathSegments.join(' ') +
              ` Q ${closingControlX} ${closingControlY} ${firstX} ${firstY} Z`
            )
          })()}
          fill="#4f46e5"
          fillOpacity="0.15"
          stroke="#4f46e5"
          strokeWidth="3"
          opacity="0.6"
        />

        {/* Points */}
        {data.map((item, idx) => {
          const angle = (idx * (360 / data.length) - 90 + 30) * (Math.PI / 180)
          const length = item.value * 16
          const x = 160 + length * Math.cos(angle)
          const y = 160 + length * Math.sin(angle)

          return (
            <g key={idx}>
              {isSmall ? (
                // Small chart - simple dots
                <>
                  <circle cx={x} cy={y} r="6" fill="#4f46e5" opacity="0.3" />
                  <circle cx={x} cy={y} r="3" fill="#4f46e5" />
                </>
              ) : (
                // Large chart - glow effect
                <>
                  <circle cx={x} cy={y} r="8" fill="#818cf8" opacity="0.3" />
                  <circle cx={x} cy={y} r="4" fill="#4f46e5" />
                  <circle cx={x} cy={y} r="3" fill="#c7d2fe" />
                </>
              )}

              {/* Labels - always show, with smart positioning */}
              {(() => {
                // Use minimum distance of 60px from center for low values to avoid overlap
                const labelDistance = Math.max(length - 30, isSmall ? 25 : 60)
                const labelX = 160 + labelDistance * Math.cos(angle)
                const labelY = 160 + labelDistance * Math.sin(angle)

                return (
                  <>
                    {item.dimension === 'Personal Time' ? (
                      <>
                        <text
                          x={labelX}
                          y={labelY - 6}
                          textAnchor="middle"
                          fontSize="14"
                          fontWeight="600"
                          fill="currentColor"
                          className="fill-gray-900 dark:fill-gray-100"
                        >
                          Personal
                        </text>
                        <text
                          x={
                            isSmall
                              ? 160 +
                                Math.max(length - 30, 25) * Math.cos(angle)
                              : labelX
                          }
                          y={
                            isSmall
                              ? 160 +
                                Math.max(length - 30, 25) * Math.sin(angle) +
                                6
                              : labelY + 6
                          }
                          textAnchor="middle"
                          fontSize="14"
                          fontWeight="600"
                          fill="currentColor"
                          className="fill-gray-900 dark:fill-gray-100"
                        >
                          Time
                        </text>
                      </>
                    ) : item.dimension === 'Common Ground' ? (
                      <>
                        <text
                          x={labelX}
                          y={labelY - 6}
                          textAnchor="middle"
                          fontSize="14"
                          fontWeight="600"
                          fill="currentColor"
                          className="fill-gray-900 dark:fill-gray-100"
                        >
                          Common
                        </text>
                        <text
                          x={labelX}
                          y={labelY + 6}
                          textAnchor="middle"
                          fontSize="14"
                          fontWeight="600"
                          fill="currentColor"
                          className="fill-gray-900 dark:fill-gray-100"
                        >
                          Ground
                        </text>
                      </>
                    ) : (
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="600"
                        fill="currentColor"
                        className="fill-gray-900 dark:fill-gray-100"
                      >
                        {item.dimension}
                      </text>
                    )}
                  </>
                )
              })()}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
