import { RemixIcon } from "../../icons/RemixIcons";

/** Quiet empty-state content shared by the MVP's small side panels. */
export function PanelEmptyState({ icon, message, description }: {
  icon: string;
  message: string;
  description?: string;
}) {
  return <div className="flex h-full flex-1 items-center justify-center px-4 text-center">
    <div className="motion-panel-empty-content">
      <RemixIcon name={icon} size={18} />
      <p>{message}</p>
      {description && <p>{description}</p>}
    </div>
  </div>;
}
