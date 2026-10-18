import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "os-button group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap outline-none select-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "os-button-default",
        outline: "os-button-outline",
        secondary: "os-button-secondary",
        ghost: "os-button-ghost",
        destructive: "os-button-destructive",
        link: "os-button-link",
      },
      size: {
        default: "os-button-md",
        xs: "os-button-xs",
        sm: "os-button-sm",
        lg: "os-button-lg",
        icon: "os-button-icon",
        "icon-xs": "os-button-icon-xs",
        "icon-sm": "os-button-icon-sm",
        "icon-lg": "os-button-icon-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-size={size}
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
