import { forwardRef, type SelectHTMLAttributes } from "react";
import { clsx } from "clsx";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} className={clsx("ui-field", className)} {...props} />,
);

Select.displayName = "Select";
