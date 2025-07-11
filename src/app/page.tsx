import style from "@/components/styles/home.module.css"
export default function Page() {
    return (
        <div className="flex flex-col p-3 min-h-[80vh]">
            <section
                className="relative flex flex-col items-center justify-center min-h-[500px] rounded-4xl p-4 text-center overflow-hidden shadow">
                <div className="relative z-10 ">
                    <h1 className="text-4xl font-bold md:text-5xl ">
                        Viví tu estilo, comprá online
                    </h1>
                    <p className="mt-4 text-lg md:text-xl max-w-2xl">
                        Descubrí las últimas tendencias en moda.
                    </p>
                </div>
                <ul className={style.background}>
                    {Array.from({ length: 49 }).map((_, i) => (
                        <li key={i}></li>
                    ))}
                </ul>
            </section>
        </div>
    )
}