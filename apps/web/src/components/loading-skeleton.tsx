export function AppShellSkeleton() {
  return (
    <div className="app-layout" aria-busy="true">
      <aside className="app-sidebar">
        <div className="brand sidebar-brand">
          <div className="skeleton skeleton-brand-mark" />
          <div className="skeleton skeleton-text-short" />
        </div>
        <nav className="sidebar-nav" aria-label="載入中">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="skeleton skeleton-nav-item" key={i} />
          ))}
        </nav>
        <div className="sidebar-account">
          <div className="skeleton skeleton-avatar" />
          <div>
            <div className="skeleton skeleton-text-short" />
            <div className="skeleton skeleton-text-sm" />
          </div>
        </div>
      </aside>
      <main className="app-main">
        <div className="app-content">
          <div className="skeleton skeleton-page-header" />
          <div className="skeleton skeleton-card-lg" />
          <div className="skeleton skeleton-card" />
        </div>
      </main>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="app-content" aria-busy="true">
      <div className="skeleton skeleton-page-header" />
      <div className="skeleton skeleton-card-lg" />
      <div className="skeleton skeleton-card" />
    </div>
  );
}
