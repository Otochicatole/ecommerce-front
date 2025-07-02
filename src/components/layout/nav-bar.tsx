import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";

export default function NavBar() {
    const dropdownLinks = [
        { href: "#", label: "view profile" },
        { href: "#", label: "Settings" },
        { href: "#", label: "Keyboard shortcuts" },
        { href: "#", label: "Company profile" },
        { href: "#", label: "Team" },
        { href: "#", label: "Invite colleagues" },
        { href: "#", label: "Help" },
        { href: "#", label: "Sign Out" },
    ];

    const links = [
        {
            href: "/",
            label: "Home",
        },
        {
            href: "/offers",
            label: "Ofertas",
        },
        {
            href: "/all",
            label: "Todo",
        },
    ]

    return (
        <>
            <nav className="fixed top-0 left-0 flex flex-row w-full justify-center gap-10 px-6 z-50 min-h-20 bg-white shadow-sm">
                <div className="flex flex-col pt-3 justify-between gap-3 w-[40%]">
                    {/* search bar */}

                    <div className="relative flex w-full text-gray-600">
                        <input
                            type="search"
                            name="serch"
                            placeholder="Search"
                            className="bg-black/2 border border-black/10 h-10 px-6 py-4 w-full pl-10 rounded-full focus:outline-none" />
                        <button
                            type="submit"
                            className="absolute left-0 top-0 mt-3 ml-4">
                            <Search size={16} />
                        </button>
                    </div>

                    <div className="flex px-6 w-full text-black/80">
                        {/* links */}

                        {links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.href}
                                className="relative z-10 flex justify-center items-center p-2 cursor-pointer border border-transparent min-w-20 hover:border-b-black">
                                <span className="mx-1">{link.label}</span>
                            </Link>
                        ))}

                        {/* dropdown */}
                        <div className="relative group inline-block ">

                            <button className="relative z-10 flex items-center p-2 cursor-pointer border border-transparent">
                                <span className="mx-1">Categorias</span>
                                <ChevronDown size={14} className="group-hover:rotate-180 transition-all" />
                            </button>

                            {/* Dropdown menu */}
                            <div className="absolute right-0 hidden group-hover:block border border-black/5 z-20 w-56 py-2  overflow-hidden bg-white rounded-md shadow-xl">
                                {dropdownLinks.map((link) => (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        className="block px-4 py-3 text-sm capitalize transition-colors duration-200 transform hover:bg-gray-100"
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div />
            </nav >
        </>
    )
}