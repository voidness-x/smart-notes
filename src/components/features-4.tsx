import { MonitorSmartphone, Shield, Users, Sparkles, Cloud, Zap } from 'lucide-react'

export default function Features() {
    return (
        <section id="features" className="bg-white py-12 md:py-20 dark:bg-background">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
                    <h2 className="text-balance text-4xl font-medium lg:text-5xl">The first step towards efficiency in writing notes</h2>
                    <p>Smart Notes is designed to help you capture, organize, and enhance your ideas seamlessly. Access your notes from any device, collaborate with your team, and leverage AI to unlock the full potential of your thoughts.</p>
                </div>

                <div className="relative mx-auto grid max-w-4xl divide-x divide-y border *:p-12 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <MonitorSmartphone className="size-4" />
                            <h3 className="text-sm font-medium">Accessibility</h3>
                        </div>
                        <p className="text-sm">Access your notes from any device, any operating system, anywhere. Works seamlessly on desktop, tablet, and mobile devices.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Shield className="size-4" />
                            <h3 className="text-sm font-medium">Security</h3>
                        </div>
                        <p className="text-sm">Your notes are protected with enterprise-grade security. Data encryption and secure authentication keep your information safe.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Users className="size-4" />
                            <h3 className="text-sm font-medium">Collaboration</h3>
                        </div>
                        <p className="text-sm">Work together in real-time. Share notes with your team, collaborate on projects, and stay synchronized with instant updates.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4" />
                            <h3 className="text-sm font-medium">AI Integration</h3>
                        </div>
                        <p className="text-sm">Enhance your notes with AI-powered insights. Get suggestions, summarize content, and unlock the full potential of your ideas.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Cloud className="size-4" />
                            <h3 className="text-sm font-medium">Cloud Sync</h3>
                        </div>
                        <p className="text-sm">Your notes are automatically synced to the cloud. Never lose your work and access it from anywhere, anytime.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Zap className="size-4" />
                            <h3 className="text-sm font-medium">Lightning Fast</h3>
                        </div>
                        <p className="text-sm">Experience blazing-fast performance with instant saves, quick search, and responsive editing that keeps up with your thoughts.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
