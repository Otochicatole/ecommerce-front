import style from "./box.module.css";

export default function Box({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`${style.box} ${className}`}
        >
            {children}
        </div>
    );
}