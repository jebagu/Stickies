import { forwardRef, type TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={clsx("ui-field ui-textarea", className)} {...props} />,
);

Textarea.displayName = "Textarea";
