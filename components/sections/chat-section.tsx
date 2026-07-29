import { Chat } from "@/components/chat";
import { Reveal } from "@/components/scroll/reveal";

export const ChatSection = () => (
  <Reveal
    className="mx-auto max-w-[1600px] scroll-mt-24 px-6 py-32 lg:px-12"
    id="chat"
  >
    <div className="grid gap-12 lg:grid-cols-[2fr_3fr] lg:gap-20">
      <div>
        <h2
          className="text-4xl font-semibold tracking-tighter text-zinc-100 sm:text-5xl"
          data-reveal
        >
          Interview my AI first.
        </h2>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-zinc-400" data-reveal>
          Grounded in my actual resume. If it can&apos;t answer, it points you
          to my inbox instead of guessing.
        </p>
      </div>
      <div data-reveal>
        <Chat />
      </div>
    </div>
  </Reveal>
);
