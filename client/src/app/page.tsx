import { BlurFade } from "@/components/magicui/blur-fade";
import { Particles } from "@/components/magicui/particles";
import { LucideMusic2 } from "lucide-react";

export default function Login() {
    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black/90 text-white relative font-Poppins">
                {/* Particles */}
                <Particles
                    className="inset-0 z-0 absolute"
                    quantity={50}
                    ease={80}
                    refresh
                />

                {/* Hero Section */}
                <div className="container mx-auto px-4 h-screen flex flex-col items-center justify-center">
                    <div className="w-full max-w-md text-center">
                        {/* Logo */}

                        <BlurFade delay={0.25} inView>
                            <div className="mb-8 flex justify-center">
                                <div className="bg-green-500 p-4 rounded-full">
                                    <LucideMusic2 size={40} className="text-white" />
                                </div>
                            </div>
                        </BlurFade>

                        {/* Welcome Text */}
                        <BlurFade delay={0.25} inView>
                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent whitespace-nowrap">
                                Vybe To your Music
                            </h1>
                        </BlurFade>
                        <BlurFade delay={0.25 * 2} inView>
                            <p className="text-gray-400 mb-8">
                                Connect with Spotify to start your musical journey
                            </p>
                        </BlurFade>

                        {/* Login Button */}
                        <BlurFade delay={0.25 * 3} inView>
                            <a
                                href={`${process.env.NEXT_PUBLIC_BACKEND_URL}auth/spotify`}
                                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-200/25"
                            >
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Spotify_icon.svg/1982px-Spotify_icon.svg.png"
                                    alt="Spotify"
                                    className="w-6 h-6"
                                />
                                Continue with Spotify
                            </a>
                        </BlurFade>
                    </div>
                </div>

                {/* Footer */}
                <footer className="absolute bottom-0 w-full py-4 text-center text-gray-400 text-sm">
                    <p>© 2025 Vybe. All rights reserved.</p>
                </footer>
            </div>
        </>
    );
}
