import { createPortal } from "react-dom";

export function VersionStamp() {
  return createPortal(
    <div className="version-stamp" aria-hidden="true">
      v{__APP_VERSION__}
    </div>,
    document.body
  );
}
