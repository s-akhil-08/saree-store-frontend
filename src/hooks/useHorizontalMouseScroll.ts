import { useEffect } from 'react';

/**
 * Custom hook to enable horizontal scrolling for mouse users on scroll rails
 * without requiring Shift or Ctrl keys. Supports both mouse wheel scrolling
 * and mouse drag-to-scroll while preventing unwanted text selection during drag.
 */
export function useHorizontalMouseScroll(
  ref: React.RefObject<HTMLDivElement | null>,
  deps: any[] = []
) {
  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    // 1. Mouse Wheel Horizontal Scroll (no Shift/Ctrl needed)
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        const canScrollLeft = container.scrollLeft > 0;
        const canScrollRight =
          container.scrollLeft < container.scrollWidth - container.clientWidth - 1;

        if ((e.deltaY > 0 && canScrollRight) || (e.deltaY < 0 && canScrollLeft)) {
          e.preventDefault();
          container.scrollLeft += e.deltaY * 1.25;
        }
      }
    };

    // 2. Mouse Drag-to-Scroll (with text selection prevention)
    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let isDragging = false;

    const stopDragging = () => {
      isDown = false;
      isDragging = false;
      container.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only primary mouse button
      isDown = true;
      isDragging = false;
      startX = e.pageX - container.offsetLeft;
      startScrollLeft = container.scrollLeft;
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    };

    const onMouseLeave = () => {
      if (isDown) stopDragging();
    };

    const onMouseUp = () => {
      if (isDown) stopDragging();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) {
        isDragging = true;
        container.style.cursor = 'grabbing';
      }
      if (isDragging) {
        e.preventDefault();
        container.scrollLeft = startScrollLeft - walk;
      }
    };

    // Prevent accidental clicks on child links/cards when dragging
    const onClickCapture = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClickCapture, true);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('click', onClickCapture, true);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, deps);
}
