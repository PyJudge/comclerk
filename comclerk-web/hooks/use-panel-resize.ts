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
  minLeftWidth: 120,
  maxLeftWidth: 400,
  minRightWidth: 200,
  maxRightWidth: 700,
  minCenterWidth: 200,
}

export function usePanelResize(
  containerRef: RefObject<HTMLDivElement>,
  options: UsePanelResizeOptions = {}
) {
  const {
    initialLeftWidth = 240,
    initialRightWidth = 520,
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

  // Adjust panels to fit container
  const adjustPanelsToFit = useCallback(() => {
    if (!containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const totalWidth = containerRect.width
    const resizeHandleWidth = 8 // 2 handles * 4px each
    const availableForPanels = totalWidth - resizeHandleWidth

    // 현재 패널 너비 합계
    const currentTotal = leftPanelWidth + rightPanelWidth + constraints.minCenterWidth

    if (currentTotal > availableForPanels) {
      // 비율 유지하면서 축소
      const targetSidePanels = availableForPanels - constraints.minCenterWidth
      const currentSidePanels = leftPanelWidth + rightPanelWidth
      const ratio = Math.max(0, targetSidePanels / currentSidePanels)

      const newLeft = Math.max(constraints.minLeftWidth, Math.floor(leftPanelWidth * ratio))
      const newRight = Math.max(constraints.minRightWidth, Math.floor(rightPanelWidth * ratio))

      setLeftPanelWidth(newLeft)
      setRightPanelWidth(newRight)
    }
  }, [leftPanelWidth, rightPanelWidth, constraints, containerRef])

  // Initial adjustment on mount
  useEffect(() => {
    // 약간의 딜레이 후 조정 (DOM이 완전히 렌더링된 후)
    const timer = setTimeout(adjustPanelsToFit, 100)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Window resize handler
  useEffect(() => {
    window.addEventListener('resize', adjustPanelsToFit)
    return () => window.removeEventListener('resize', adjustPanelsToFit)
  }, [adjustPanelsToFit])

  return {
    leftPanelWidth,
    rightPanelWidth,
    isDragging,
    handleMouseDown,
  }
}
