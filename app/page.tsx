import { Nav } from "@/components/nav";
import { Runner } from "@/components/game/runner";
import { StackStrip } from "@/components/stack-strip";
import { SmoothScroll } from "@/components/scroll/smooth-scroll";
import { ChatSection } from "@/components/sections/chat-section";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { Journey } from "@/components/sections/journey";
import { Leadership } from "@/components/sections/leadership";
import { Projects } from "@/components/sections/projects";
import { Skills } from "@/components/sections/skills";
import { PaintBackground } from "@/components/three/paint-background";

export default function Home() {
  return (
    <main id="top">
      <PaintBackground />
      <SmoothScroll />
      <Nav />
      <Hero />
      <StackStrip />
      <Journey />
      <Skills />
      <Projects />
      <Leadership />
      <ChatSection />
      <Runner />
      <Footer />
    </main>
  );
}
