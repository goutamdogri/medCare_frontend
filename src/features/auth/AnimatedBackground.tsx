import { useEffect, useRef } from "react";
import gsap from "gsap";

const DOT_COUNT = 35;

const COLORS = [
  "rgba(255,255,255,0.90)",  // white
  "rgba(150,240,255,0.85)",  // cyan
  "rgba(220,190,255,0.88)",  // lavender
  "rgba(255,200,235,0.82)",  // pink
  "rgba(180,210,255,0.85)",  // soft blue
];

function AnimatedBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const dots = [];
    const animations = [];

    // =========================================
    // CREATE DOTS
    // =========================================

    for (let i = 0; i < DOT_COUNT; i++) {
      const dot = document.createElement("span");

      const size = gsap.utils.random(2, 4);

      const baseX = gsap.utils.random(2, 98);
      const baseY = gsap.utils.random(2, 98);

      dot.className = `
        absolute
        rounded-full
        pointer-events-none
        will-change-transform
      `;

      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;

      dot.style.left = `${baseX}%`;
      dot.style.top = `${baseY}%`;

      dot.style.background =
        COLORS[
          Math.floor(Math.random() * COLORS.length)
        ];

 dot.style.opacity =
  gsap.utils.random(0.55, 0.9);

      container.appendChild(dot);

      // =========================================
      // MOVEMENT STATE
      // =========================================

      const state = {
        x: 0,
        y: 0,

        cursorX: 0,
        cursorY: 0,
      };

      dots.push({
        dot,
        state,
        baseX,
        baseY,
      });

      // =========================================
      // CONTINUOUS NATURAL MOVEMENT
      // =========================================

      const move = () => ({
        x: gsap.utils.random(-100, 100),
        y: gsap.utils.random(-80, 80),

        // FAST MOVEMENT
        duration: gsap.utils.random(0.6, 1.2),

        ease: "sine.inOut",
      });

      const timeline = gsap.timeline({
        repeat: -1,
        delay: gsap.utils.random(0, 3),
      });

      timeline
        .to(state, move())
        .to(state, move())
        .to(state, move())
        .to(state, move())
        .to(state, move())
        .to(state, move());

      animations.push(timeline);

      // =========================================
      // SUBTLE OPACITY
      // =========================================

      const opacityAnimation = gsap.to(dot, {
        opacity: gsap.utils.random(0.3, 0.75),

        duration: gsap.utils.random(2.5, 5),

        ease: "sine.inOut",

        repeat: -1,

        yoyo: true,

        delay: gsap.utils.random(0, 3),
      });

      animations.push(opacityAnimation);
    }

    // =========================================
    // RENDER DOTS
    // =========================================

    const render = () => {
      dots.forEach(({ dot, state }) => {
        dot.style.transform = `
          translate3d(
            ${state.x + state.cursorX}px,
            ${state.y + state.cursorY}px,
            0
          )
        `;
      });
    };

    gsap.ticker.add(render);

    // =========================================
    // FLOWING LINES
    // =========================================

    const lines = container.querySelectorAll(
      ".flowing-line"
    );

    lines.forEach((line, index) => {
      const lineState = {
        x: 0,
        y: 0,
        rotation: 0,
      };

      const lineAnimation = gsap.timeline({
        repeat: -1,
        yoyo: true,

        delay: index * 0.4,
      });

      lineAnimation.to(lineState, {
        x: index % 2 === 0 ? 35 : -35,

        y:
          index === 0
            ? -18
            : index === 1
            ? 22
            : -15,

        rotation:
          index % 2 === 0
            ? 1.5
            : -1.5,

        duration:
          index === 1
            ? 3.5
            : 3,

        ease: "sine.inOut",

        onUpdate: () => {
          gsap.set(line, {
            x: lineState.x,
            y: lineState.y,
            rotation: lineState.rotation,

            transformOrigin:
              "center center",
          });
        },
      });

      animations.push(lineAnimation);

      // =========================================
      // SLIGHT OPACITY FLOW
      // =========================================

      const lineOpacity = gsap.to(line, {
        opacity:
          index === 0
            ? 0.75
            : index === 1
            ? 0.65
            : 0.55,

        duration: 2.5 + index * 0.5,

        ease: "sine.inOut",

        repeat: -1,

        yoyo: true,

        delay: index * 0.5,
      });

      animations.push(lineOpacity);
    });

    // =========================================
    // MOUSE INTERACTION
    // =========================================

    const handleMouseMove = (event) => {
      const rect =
        container.getBoundingClientRect();

      const mouseX =
        event.clientX - rect.left;

      const mouseY =
        event.clientY - rect.top;

      const radius = 160;

      dots.forEach(
        ({ state, baseX, baseY }) => {
          // Include natural movement
          const dotX =
            (baseX / 100) * rect.width +
            state.x;

          const dotY =
            (baseY / 100) * rect.height +
            state.y;

          const dx = dotX - mouseX;
          const dy = dotY - mouseY;

          const distance = Math.sqrt(
            dx * dx + dy * dy
          );

          // =====================================
          // CURSOR REPULSION
          // =====================================

          if (
            distance < radius &&
            distance > 0
          ) {
            const strength =
              1 - distance / radius;

            const angle =
              Math.atan2(dy, dx);

            const force =
              strength * 45;

            const targetX =
              Math.cos(angle) * force;

            const targetY =
              Math.sin(angle) * force;

            gsap.to(state, {
              cursorX: targetX,
              cursorY: targetY,

              duration: 0.35,

              ease: "power3.out",

              overwrite: "auto",
            });
          } else {
            gsap.to(state, {
              cursorX: 0,
              cursorY: 0,

              duration: 0.8,

              ease: "power3.out",

              overwrite: "auto",
            });
          }
        }
      );
    };

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    // =========================================
    // CLEANUP
    // =========================================

    return () => {
      gsap.ticker.remove(render);

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      animations.forEach((animation) => {
        animation.kill();
      });

      dots.forEach(({ dot, state }) => {
        gsap.killTweensOf(state);
        gsap.killTweensOf(dot);

        dot.remove();
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="
        pointer-events-none
        absolute
        inset-0
        overflow-hidden
      "
    >
      {/* ================================= */}
      {/* BASE GRADIENT */}
      {/* ================================= */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-br
          from-indigo-500
          via-violet-600
          to-purple-700
        "
      />

      {/* ================================= */}
      {/* SOFT LIGHT */}
      {/* ================================= */}

      <div
        className="
          absolute
          -left-40
          -top-40
          h-[450px]
          w-[450px]
          rounded-full
          bg-white/[0.05]
          blur-[120px]
        "
      />

      <div
        className="
          absolute
          -bottom-40
          -right-40
          h-[500px]
          w-[500px]
          rounded-full
          bg-fuchsia-300/[0.06]
          blur-[130px]
        "
      />

      {/* ================================= */}
      {/* FLOWING LINES */}
      {/* ================================= */}

      <svg
        className="
          absolute
          inset-0
          h-full
          w-full
        "
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        {/* LINE 1 */}

        <path
  className="flowing-line"
  d="
    M -100 170
    C 100 80,
      220 120,
      350 210
    S 600 350,
      800 190
    S 1050 100,
      1150 180
  "
  fill="none"
  stroke="rgba(255,255,255,0.28)"
  strokeWidth="1.5"
/>

<path
  className="flowing-line"
  d="
    M -100 480
    C 120 380,
      240 430,
      400 540
    S 650 650,
      820 500
    S 1050 400,
      1150 500
  "
  fill="none"
  stroke="rgba(150,240,255,0.22)"
  strokeWidth="1.5"
/>

<path
  className="flowing-line"
  d="
    M -100 760
    C 100 650,
      250 700,
      400 800
    S 650 920,
      820 750
    S 1050 650,
      1150 760
  "
  fill="none"
  stroke="rgba(220,190,255,0.24)"
  strokeWidth="1.5"
/>
      </svg>
    </div>
  );
}

export default AnimatedBackground;