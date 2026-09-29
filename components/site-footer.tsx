export function SiteFooter() {
  return (
    <footer className="mt-auto border-t px-4 py-5 text-center text-xs leading-5 text-muted-foreground sm:px-6">
      <p>
        © 2026{" "}
        <a
          href="https://iistw.com/"
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Canis
        </a>
        <span aria-hidden="true"> · </span>保留所有權利。
      </p>
    </footer>
  )
}
