"use client";

export function TopBar() {
  return (
    <header className="topbar-shell">
      <div className="topbar-inner">
        <div className="topbar-spacer" />

        <div className="topbar-group">
          <div className="topbar-field">
            <label className="topbar-label">Property</label>
            <select className="topbar-select" defaultValue="Morenci">
              <option>Morenci</option>
              <option>Safford</option>
              <option>Sierrita</option>
              <option>Shop</option>
            </select>
          </div>

          <div className="topbar-user">
            <div className="user-avatar">U</div>
            <div className="user-meta">
              <div className="user-name">User</div>
              <div className="user-role">Technician</div>
            </div>
          </div>

          <button className="history-button" type="button">
            History
          </button>
        </div>
      </div>
    </header>
  );
}