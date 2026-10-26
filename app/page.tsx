import { Nav } from "@/components/nav";
import { Runner } from "@/components/game/runner";
import { ProgressRail } from "@/components/scroll/progress-rail";
import { SmoothScroll } from "@/components/scroll/smooth-scroll";
import { Footer } from "@/components/sections/footer";
import { Journey } from "@/components/sections/journey";
import { Leadership } from "@/components/sections/leadership";
import { Projects } from "@/components/sections/projects";
import { Skills } from "@/components/sections/skills";
import { Companion } from "@/components/stage/companion";
import { Story } from "@/components/stage/story";
import { PaintBackground } from "@/components/three/paint-background";

export default function Home() {
  return (
    <main id="top">
      <PaintBackground />
      <SmoothScroll />
      <Nav />
      <ProgressRail />
      <Story />
      <Journey />
      <Projects />
      <Skills />
      <Leadership />
      <Runner />
      <Footer />
      {/* After Story so its pin spacing exists when these triggers measure. */}
      <Companion />
    </main>
  );
}
