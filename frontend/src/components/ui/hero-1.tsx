"use client"

import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroProps {
    eyebrow?: string
    title: string
    subtitle: string
    ctaLabel?: string
    ctaHref?: string
}

export function Hero({
    eyebrow = "Innovate Without Limits",
    title,
    subtitle,
    ctaLabel = "Explore Now",
    ctaHref = "#",
}: HeroProps) {
    
    // Function to handle smooth scrolling for internal anchors
    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (ctaHref.startsWith('#')) {
            e.preventDefault();
            const element = document.querySelector(ctaHref);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    const isInternalScroll = ctaHref.startsWith('#');

    return (
        <section
            id="hero"
            className="relative mx-auto w-full pt-40 px-6 text-center md:px-8 
      min-h-[calc(100vh-40px)] overflow-hidden 
      bg-[linear-gradient(to_bottom,#fff,#ffffff_50%,#e8e8e8_88%)]  
      dark:bg-[linear-gradient(to_bottom,#000,#0000_30%,#898e8e_78%,#ffffff_99%_50%)] 
      rounded-b-xl"
        >
            {/* 1. Grid BG - Added pointer-events-none */}
            <div
                className="absolute -z-10 inset-0 opacity-80 h-[600px] w-full 
        bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] 
        dark:bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)]
        bg-[size:6rem_5rem] 
        [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]
        pointer-events-none"
            />

            {/* 2. Radial Accent - Added pointer-events-none to prevent blocking clicks */}
            <div
                className="absolute left-1/2 top-[calc(100%-90px)] lg:top-[calc(100%-150px)] 
        h-[500px] w-[700px] md:h-[500px] md:w-[1100px] lg:h-[750px] lg:w-[140%] 
        -translate-x-1/2 rounded-[100%] border-[#B48CDE] bg-white dark:bg-black 
        bg-[radial-gradient(closest-side,#fff_82%,#000000)] 
        dark:bg-[radial-gradient(closest-side,#000_82%,#ffffff)] 
        animate-fade-up pointer-events-none"
            />

            {/* Eyebrow */}
            {eyebrow && (
                <div className="relative z-20 mb-4 flex justify-center">
                    <a href="#" className="group">
                        <span
                            className="text-sm text-gray-600 dark:text-gray-400 font-geist mx-auto px-5 py-2 
                bg-gradient-to-tr from-zinc-300/5 via-gray-400/5 to-transparent  
                border-[2px] border-gray-300/20 dark:border-white/5 
                rounded-3xl w-fit tracking-tight uppercase flex items-center justify-center"
                        >
                            {eyebrow}
                            <ChevronRight className="inline w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                    </a>
                </div>
            )}

            {/* Title */}
            <h1
                className="animate-fade-in relative z-20 -translate-y-4 text-balance 
        bg-gradient-to-br from-black from-30% to-black/40 
        bg-clip-text py-6 text-5xl font-semibold leading-none tracking-tighter 
        text-transparent opacity-0 sm:text-6xl md:text-7xl lg:text-8xl 
        dark:from-white dark:to-white/40"
            >
                {title}
            </h1>

            {/* Subtitle */}
            <p
                className="animate-fade-in relative z-20 mb-12 -translate-y-4 text-balance 
        text-lg tracking-tight text-gray-600 dark:text-gray-400 
        opacity-0 md:text-xl"
            >
                {subtitle}
            </p>

            {/* CTA - Higher Z-index and relative positioning to stay on top */}
            {ctaLabel && (
                <div className="relative z-50 flex justify-center">
                    <Button
                        asChild
                        className="mt-[-20px] w-fit md:w-52 font-geist tracking-tighter text-center text-lg shadow-lg"
                    >
                        <a 
                            href={ctaHref} 
                            target={isInternalScroll ? "_self" : "_blank"} 
                            rel={isInternalScroll ? "" : "noopener noreferrer"}
                            onClick={isInternalScroll ? handleScroll : undefined}
                        >
                            {ctaLabel}
                        </a>
                    </Button>
                </div>
            )}

            {/* 3. Bottom Fade - Added pointer-events-none */}
            <div
                className="animate-fade-up relative mt-32 opacity-0 [perspective:2000px] 
        after:absolute after:inset-0 after:z-10 
        after:[background:linear-gradient(to_top,hsl(var(--background))_10%,transparent)]
        pointer-events-none"
            />
        </section>
    )
}