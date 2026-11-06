import RevealSection from "./RevealSection";

export default function MainContainer() {
  return (
    <section
      id="about"
      className="flex flex-col md:flex-row h-auto px-6 md:px-20 py-12 gap-8 md:gap-16 bg-zinc-300"
    >
      <RevealSection className="self-start flex-1">
        <h1 className="text-3xl font-semibold pb-2">About Me</h1>

        <p className="text-xl font-normal leading-8 text-wrap">
          Hi, I&apos;m Nithin Raju, a Full Stack Developer who enjoys building
          production-grade web platforms that solve real problems at scale. Over
          the past years, I&apos;ve worked across React, Next.js, TypeScript,
          and Node.js to ship everything from a custom video/media player and
          device-fleet management tools for a digital-signage platform, to a
          franchise-based service marketplace and a real-time dating app. I care
          about owning features end-to-end — from UI design through API
          integration, feature-flagged rollouts, and clean, scalable
          architecture. When I&apos;m not building, I&apos;m usually exploring
          new tools in the React ecosystem. Let&apos;s connect if you&apos;re
          working on something interesting!
        </p>
      </RevealSection>
    </section>
  );
}
