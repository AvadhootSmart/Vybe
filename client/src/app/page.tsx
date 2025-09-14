import { BlurFade } from "@/components/magicui/blur-fade";
import { Particles } from "@/components/magicui/particles";
import { IconBrandGoogleFilled } from "@tabler/icons-react";

export default function Login() {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black/90 text-white relative font-Poppins">
        {/* Particles */}
        <Particles
          className="inset-0 z-0 absolute"
          quantity={500}
          ease={80}
          refresh
        />

        {/* Hero Section */}
        <div className="container mx-auto px-4 h-screen flex flex-col items-center justify-center">
          <div className="w-full max-w-md text-center">
            {/* Logo */}

            <BlurFade delay={0.25} inView>
              <div className="mb-8 flex justify-center">
                <a href={`${process.env.BACKEND_URL}/auth/spotify`}>
                  <img
                    src="/apple-touch-icon.png"
                    alt="Vybe Logo"
                    className="size-24 rounded-xl"
                  />
                </a>
              </div>
            </BlurFade>

            {/* Welcome Text */}
            <BlurFade delay={0.25} inView>
              <h1 className="text-4xl font-bold mb-4 text-white whitespace-nowrap">
                Vybe
              </h1>
            </BlurFade>
            <BlurFade delay={0.25 * 2} inView>
              <p className="text-gray-400 mb-8">
                Music hits different when you share the{" "}
                <span className="text-[#a7f1e1] font-semibold">Vybe</span>.
              </p>
            </BlurFade>

            <BlurFade delay={0.25 * 4} inView>
              <a
                href={`${process.env.BACKEND_URL}/auth/google`}
                className="inline-flex items-center justify-center gap-2 bg-neutral-800 hover:bg-[#a7f1e1] text-white hover:text-black font-semibold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-200/25 mt-2"
              >
                <IconBrandGoogleFilled />
                Continue with Google
              </a>
            </BlurFade>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-0 w-full py-4 text-center text-gray-400 text-sm">
          <p>
            Built with ❤️ by{" "}
            <a
              href="https://github.com/AvadhootSmart"
              className="text-[#a7f1e1]"
            >
              Avadhoot Smart
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
