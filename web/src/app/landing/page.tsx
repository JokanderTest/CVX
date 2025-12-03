import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Local navbar for landing only */}
      <header className="w-full border-b border-white/10">
        <div className="mx-auto px-6 py-2 flex items-center justify-between">
          {/* Logo */}

            <div className="flex items-center">
            <Image 
                src="/LogoV1.1.png"   // ضع الصورة التي تريدها
                alt="CVX Logo"
                width={80}
                height={80}
                className="object-contain"
            />
            </div>


          {/* Auth actions (only for landing) */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-lg border border-white/50 text-sm font-medium !text-[var(--foreground)] bg-transparent hover:bg-white/10 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-sm font-semibold !text-[var(--foreground)] transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
          {/* 12-column grid: left 5, right 7 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left content (5/12) */}
            <div className="lg:col-span-5">
              <h1 className="text-[64px] sm:text-[80px] lg:text-[150px] font-extrabold leading-[0.8]">
                CV-X
              </h1>

              <h2 className="mt-4 text-xl sm:text-2xl font-semibold text-primary">
                Simple, Smart, and Professional
              </h2>

              <p className="mt-6 text-sm sm:text-base leading-relaxed max-w-[360px] text-foreground/80">
                Build a resume that speaks with clarity, confidence, and
                purpose. CVX combines intelligent writing, precise structure,
                and clean design to transform your experience into a compelling
                professional identity.
              </p>

              <div className="mt-8">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 font-semibold !text-[var(--foreground)] text-sm sm:text-base transition-colors"
                >
                  Create your CV Now
                </Link>
              </div>
            </div>

            {/* Right visual (7/12) */}
            <div className="lg:col-span-7">
              {/* Right visual (blur circle + image) */}
              <div className="relative flex items-center justify-center lg:justify-end">
                {/* White blurred circle behind */}
                <div className="
                absolute 
                left-1/2 -translate-x-1/2 
                w-80 h-80 
                sm:w-96 sm:h-96 
                lg:w-[700px] lg:h-[450px] 
                rounded-full 
                bg-white/5 
                blur-3xl
                " />


                {/* CV preview image */}
                <div className="relative z-10 w-full max-w-2xl">
                  <Image
                    src="/3cv.webp"
                    alt="CVX resume previews"
                    width={900}
                    height={900}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
