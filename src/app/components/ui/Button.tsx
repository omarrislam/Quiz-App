import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ variant = "primary", ...props }: Props) {
  const className = variant === "primary" ? "button" : "button";
  return <button className={className} {...props} />;
}
