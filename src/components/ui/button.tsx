import React from "react";

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
  switch (variant) {
    case "primary":
      return (
        <button
          type={type}
          onClick={onClick}
          disabled={disabled}
          className={`px-4 py-2 flex flex-row font-medium cursor-pointer text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        >
          {children}
        </button>
      );
    case "secondary":
      return (
        <button
          type={type}
          onClick={onClick}
          disabled={disabled}
          className={`px-4 py-2 font-medium flex flex-row cursor-pinter text-white bg-gray-500 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        >
          {children}
        </button>
      );
    case "danger":
      return (
        <button
          type={type}
          onClick={onClick}
          disabled={disabled}
          className={`px-4 py-2 flex flex-row cursor-pointer font-medium text-white bg-red-500 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        >
          {children}
        </button>
      );
    default:
      return null;
  }
};

export default Button;
