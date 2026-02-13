"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavigate, useLocation } from "react-router-dom"

interface NavItem {
    name: string
    url: string
    icon: LucideIcon
}

interface NavBarProps {
    items: NavItem[]
    className?: string
}

export function NavBar({ items, className }: NavBarProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const [activeTab, setActiveTab] = useState(items[0].name)
    const [_isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Update active tab based on current location
    useEffect(() => {
        const currentItem = items.find(item => item.url === location.pathname)
        if (currentItem) {
            setActiveTab(currentItem.name)
        }
    }, [location.pathname, items])

    const handleClick = (item: NavItem) => {
        setActiveTab(item.name)
        if (item.url.startsWith('#')) {
            // Handle anchor links
            const element = document.querySelector(item.url)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
            }
        } else {
            // Open dashboard in new tab for "Get Started"
            if (item.name === "Get Started") {
                const fullUrl = item.url.startsWith('http') 
                    ? item.url 
                    : `${window.location.origin}${item.url}`
                window.open(fullUrl, '_blank', 'noopener,noreferrer')
            } else {
                // Handle route navigation for other items
                navigate(item.url)
            }
        }
    }

    return (
        <div
            className={cn(
                "fixed top-0 left-1/2 -translate-x-1/2 z-50 pt-6",
                className,
            )}
        >
            <div className="flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
                {items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.name

                    return (
                        <button
                            key={item.name}
                            onClick={() => handleClick(item)}
                            className={cn(
                                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                                "text-foreground/80 hover:text-primary",
                                isActive && "bg-muted text-primary",
                            )}
                        >
                            <span className="hidden md:inline">{item.name}</span>
                            <span className="md:hidden">
                                <Icon size={18} strokeWidth={2.5} />
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="lamp"
                                    className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30,
                                    }}
                                >
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                                        <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                                        <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                                        <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                                    </div>
                                </motion.div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
