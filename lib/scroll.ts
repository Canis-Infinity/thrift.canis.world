// Wait for route/dialog layout and focus restoration before moving the document.
export function scrollPageToTop(behavior: ScrollBehavior = "instant") {
  let frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : behavior,
      })
    })
  })
  return () => cancelAnimationFrame(frame)
}
