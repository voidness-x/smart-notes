import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { HeroHeader } from './header'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { getUser } from '@/auth/server'

export default async function HeroSection() {
    let isLoggedIn = false;
    try {
        const user = await getUser();
        isLoggedIn = !!user;
    } catch (error) {
        // If there's an auth error, just treat as not logged in
        // This prevents the page from crashing if there's a session issue
        isLoggedIn = false;
    }

    return (
        <>
            <HeroHeader isLoggedIn={isLoggedIn} />
            <main className="overflow-x-hidden">
                <section className="bg-white dark:bg-background relative overflow-hidden">
                    <div className="pb-24 pt-12 md:pb-32 lg:pb-56 lg:pt-44">
                        <div className="relative mx-auto flex max-w-6xl flex-col px-6 lg:block">
                            <div className="relative z-20 mx-auto max-w-lg text-center lg:ml-0 lg:w-1/2 lg:text-left">
                                <h1 className="mt-8 max-w-2xl text-balance text-5xl font-medium md:text-6xl lg:mt-16 xl:text-7xl">Write 10X faster with...</h1>
                                <p className="mt-8 max-w-2xl text-pretty text-lg"> A minimalist website with A.I capabilities that provides a very simple way to write and save your notes! <br /><br /> Use now for free: </p>

                                <div className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                                    {isLoggedIn ? (
                                        <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                                            <p className="text-lg text-muted-foreground">
                                                You are already logged in.
                                            </p>
                                            <Button
                                                asChild
                                                size="lg"
                                                className="px-5 text-base">
                                                <Link href="/notes">
                                                    <span className="text-nowrap">Go to your notes →</span>
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Button
                                                asChild
                                                size="lg"
                                                className="px-5 text-base">
                                                <Link href="/sign-up">
                                                    <span className="text-nowrap">Sign-Up</span>
                                                </Link>
                                            </Button>
                                            <Button
                                                key={2}
                                                asChild
                                                size="lg"
                                                variant="ghost"
                                                className="px-5 text-base">
                                                <Link href="/login">
                                                    <span className="text-nowrap">Log-In</span>
                                                </Link>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Image
                                className="smart-notes-hero-image order-first ml-auto h-56 w-full object-cover sm:h-96 lg:absolute lg:inset-0 lg:-right-20 lg:-top-96 lg:order-last lg:h-max lg:w-2/3 lg:object-contain lg:z-10"
                                src="/Smart Notes.png"
                                alt="Smart Notes Logo"
                                height="3000"
                                width="2000"
                                priority
                            />
                        </div>
                    </div>
                </section>
                <section className="bg-white pb-16 md:pb-32 dark:bg-background">
                    <div className="group relative m-auto max-w-6xl px-6">
                        <div className="flex flex-col items-center md:flex-row">
                            <div className="md:max-w-44 md:border-r md:pr-6">
                                <p className="text-end text-sm">Powered by:</p>
                            </div>
                            <div className="relative py-6 md:w-[calc(100%-11rem)]">
                                <InfiniteSlider
                                    speedOnHover={20}
                                    speed={40}
                                    gap={112}>
                                    <div className="flex">
                                        <img
                                            className="logo-theme-aware mx-auto h-5 w-fit"
                                            src="/VS Code.png"
                                            alt="VS Code Logo"
                                            height="20"
                                            width="auto"
                                        />
                                    </div>

                                    <div className="flex">
                                        <img
                                            className="logo-theme-aware mx-auto h-4 w-fit"
                                            src="/React.png"
                                            alt="React Logo"
                                            height="16"
                                            width="auto"
                                        />
                                    </div>
                                    <div className="flex">
                                        <img
                                            className="logo-theme-aware mx-auto h-4 w-fit"
                                            src="/Node JS.png"
                                            alt="Node JS Logo"
                                            height="16"
                                            width="auto"
                                        />
                                    </div>
                                    <div className="flex">
                                        <img
                                            className="logo-theme-aware mx-auto h-5 w-fit"
                                            src="/Supabase.png"
                                            alt="Supabase Logo"
                                            height="20"
                                            width="auto"
                                        />
                                    </div>
                                    <div className="flex">
                                        <img
                                            className="logo-theme-aware mx-auto h-5 w-fit"
                                            src="/Prisma.png"
                                            alt="Prisma"
                                            height="20"
                                            width="auto"
                                        />
                                    </div>
                                    <div className="flex">
                                        <img
                                            className="logo-theme-aware mx-auto h-4 w-fit"
                                            src="/OpenAI.png"
                                            alt="Open AI Logo"
                                            height="16"
                                            width="auto"
                                        />
                                    </div>
                                </InfiniteSlider>

                                <div className="bg-gradient-to-r from-white to-transparent absolute inset-y-0 left-0 w-20 dark:from-background"></div>
                                <div className="bg-gradient-to-l from-white to-transparent absolute inset-y-0 right-0 w-20 dark:from-background"></div>
                                <ProgressiveBlur
                                    className="pointer-events-none absolute left-0 top-0 h-full w-20"
                                    direction="left"
                                    blurIntensity={1}
                                />
                                <ProgressiveBlur
                                    className="pointer-events-none absolute right-0 top-0 h-full w-20"
                                    direction="right"
                                    blurIntensity={1}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}
