import { clsx } from "clsx";

type ToggleProps = {
  checked: boolean;
  label: string;
  onChange: () => void;
};

export function Toggle({ checked, label, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      className={clsx("ui-toggle", checked && "ui-toggle--checked")}
      aria-pressed={checked}
      onClick={onChange}
    >
      <span className="ui-toggle__track">
        <span className="ui-toggle__thumb" />
      </span>
      <span>{label}</span>
    </button>
  );
}
