// [COMCLERK-ADDED] 2024-12-01: 3패널 리사이즈 훅

import { useState, useRef, useCallback, useEffect, useMemo, RefObject } from 'react'

interface PanelConstraints {
  minLeftWidth: number
  maxLeftWidth: number
  minRightWidth: number
  maxRightWidth: number
  minCenterWidth: number
}

interface UsePanelResizeOptions {
  initialLeftWidth?: number
  initialRightWidth?: number
  constraints?: Partial<PanelConstraints>
}

const DEFAULT_CONSTRAINTS: PanelConstraints = {
  minLeftWidth: 200,
  maxLeftWidth: 500,
  minRightWidth: 300,
  maxRightWidth: 600,
  minCenterWidth: 400,
}

export function usePanelResize(
  containerRef: RefObject<HTMLDivElement>,
  options: UsePanelResizeOptions = {}
) {
  const {
    initialLeftWidth = 320,
    initialRightWidth = 384,
    constraints: customConstraints,
  } = options

  const minLeftWidth = customConstraints?.minLeftWidth ?? DEFAULT_CONSTRAINTS.minLeftWidth
  const maxLeftWidth = customConstraints?.maxLeftWidth ?? DEFAULT_CONSTRAINTS.maxLeftWidth
  const minRightWidth = customConstraints?.minRightWidth ?? DEFAULT_CONSTRAINTS.minRightWidth
  const maxRightWidth = customConstraints?.maxRightWidth ?? DEFAULT_CONSTRAINTS.maxRightWidth
  const minCenterWidth = customConstraints?.minCenterWidth ?? DEFAULT_CONSTRAINTS.minCenterWidth

  const constraints = useMemo(() => ({
    minLeftWidth,
    maxLeftWidth,
    minRightWidth,
    maxRightWidth,
    minCenterWidth,
  }), [minLeftWidth, maxLeftWidth, minRightWidth, maxRightWidth, minCenterWidth])

  const [leftPanelWidth, setLeftPanelWidth] = useState(initialLeftWidth)
  const [rightPanelWidth, setRightPanelWidth] = useState(initialRightWidth)
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null)

  const dragStartX = useRef(0)
  const dragStartLeftWidth = useRef(0)
  const dragStartRightWidth = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle: 'left' | 'right') => {
      e.preventDefault()
      setIsDragging(handle)
      dragStartX.current = e.clientX
      dragStartLeftWidth.current = leftPanelWidth
      dragStartRightWidth.current = rightPanelWidth

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [leftPanelWidth, rightPanelWidth]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const totalWidth = containerRect.width
      const deltaX = e.clientX - dragStartX.current

      if (isDragging === 'left') {
        const newLeftWidth = dragStartLeftWidth.current + deltaX
        const maxAllowedLeft = Math.min(
          constraints.maxLeftWidth,
          totalWidth - rightPanelWidth - constraints.minCenterWidth
        )

        const constrainedWidth = Math.max(
          constraints.minLeftWidth,
          Math.min(newLeftWidth, maxAllowedLeft)
        )
        setLeftPanelWidth(constrainedWidth)
      } else if (isDragging === 'right') {
        const newRightWidth = dragStartRightWidth.current - deltaX
        const maxAllowedRight = Math.min(
          constraints.maxRightWidth,
          totalWidth - leftPanelWidth - constraints.minCenterWidth
        )

        const constrainedWidth = Math.max(
          constraints.minRightWidth,
          Math.min(newRightWidth, maxAllowedRight)
        )
        setRightPanelWidth(constrainedWidth)
      }
    },
    [isDragging, leftPanelWidth, rightPanelWidth, constraints, containerRef]
  )

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(null)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging])

  // Global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const totalWidth = containerRect.width
      const minTotalWidth =
        constraints.minLeftWidth + constraints.minCenterWidth + constraints.minRightWidth

      if (totalWidth < minTotalWidth) {
        setLeftPanelWidth(constraints.minLeftWidth)
        setRightPanelWidth(constraints.minRightWidth)
      } else {
        const availableWidth = totalWidth - constraints.minCenterWidth
        const currentTotal = leftPanelWidth + rightPanelWidth

        if (currentTotal > availableWidth) {
          const leftRatio = leftPanelWidth / currentTotal
          const rightRatio = rightPanelWidth / currentTotal

          setLeftPanelWidth(
            Math.max(constraints.minLeftWidth, Math.floor(availableWidth * leftRatio))
          )
          setRightPanelWidth(
            Math.max(constraints.minRightWidth, Math.floor(availableWidth * rightRatio))
          )
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [leftPanelWidth, rightPanelWidth, constraints, containerRef])

  return {
    leftPanelWidth,
    rightPanelWidth,
    isDragging,
    handleMouseDown,
  }
}
