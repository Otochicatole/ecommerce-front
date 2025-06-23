import React from "react";
import styles from "../styles/button.module.css";

type ButtonProps = {
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger";
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string; // Para clases adicionales
};

const Button: React.FC<ButtonProps> = ({
  type = "button",
  variant = "primary",
  onClick,
  children,
  disabled = false,
  className = "",
}) => {
  let variantClass = "";
  switch (variant) {
    case "primary":
      variantClass = styles.primary;
      break;
    case "secondary":
      variantClass = styles.secondary;
      break;
    case "danger":
      variantClass = styles.danger;
      break;
    default:
      variantClass = "";
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${variantClass} ${disabled ? styles.disabled : ""} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
