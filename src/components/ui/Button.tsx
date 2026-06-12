import { forwardRef, type ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={clsx("ui-button", `ui-button--${variant}`, className)} {...props} />
  ),
);

Button.displayName = "Button";
