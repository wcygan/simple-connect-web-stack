import type { ComponentChildren } from "preact";

export interface ButtonProps {
  onClick?: () => void;
  children?: ComponentChildren;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', ...otherProps } = props;
  
  const baseClasses = "font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "btn-primary",
    danger: "btn-danger", 
    secondary: "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 focus:ring-gray-500"
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
  
  return (
    <button
      {...otherProps}
      class={classes}
    />
  );
}
