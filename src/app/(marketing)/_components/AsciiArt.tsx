"use client";

import { motion } from "framer-motion";

const illustrations: Record<string, string[]> = {
  cross: [
    "         |          ",
    "        /|\\        ",
    "       /|||\\       ",
    "      /|||||\\      ",
    "     /|||||||\\     ",
    "    /|||||||||\\    ",
    "   /|||||||||||\\   ",
    "  /|||||||||||||\\  ",
    " /|||||||||||||||\\ ",
    "||||||||||||||||||||",
    " |||||||||||||||||| ",
    "  ||||||||||||||||  ",
    "   ||||||||||||||   ",
    "    ||||||||||||    ",
    "     ||||||||||     ",
    "      ||||||||      ",
    "       ||||||       ",
    "        ||||        ",
    "         ||         ",
    "         ||         ",
    "         ||         ",
    "         ||         ",
    "        /||\\       ",
    "       /||||\\      ",
    "      /||||||\\     ",
    "     /||||||||\\    ",
  ],
  dove: [
    "              .-'''''-.           ",
    "            .'         '.         ",
    "           /   O     O   \\        ",
    "          :                :       ",
    "          |                |       ",
    "          :    \\____/    :       ",
    "           \\    `-`    /         ",
    "            '.  ___  .'           ",
    "              / /|\\ \\            ",
    "             / / | \\ \\           ",
    "            / /  |  \\ \\          ",
    "           / /   |   \\ \\         ",
    "          /_/____|____\\_\\        ",
    "            \\________/           ",
  ],
  moon: [
    "        .--.        ",
    "       /    \\       ",
    "      |  *   |      ",
    "      |    * |   *  ",
    "       \\    /       ",
    "    *   '--'   *    ",
    "         **         ",
    "   *            *   ",
    "         **         ",
  ],
  book: [
    "     _______________     ",
    "    /               /|   ",
    "   /_______________/ |   ",
    "  |               |  |   ",
    "  |    ~  ~  ~    | /    ",
    "  |    ~  ~  ~    |/     ",
    "  |    ~  ~  ~    |      ",
    "  |_______________|      ",
    "  |_______________|      ",
    "  |               |      ",
    "  |    ~  ~  ~    |      ",
    "  |    ~  ~  ~    |      ",
    "  |    ~  ~  ~    |      ",
    "  |_______________|      ",
  ],
  hands: [
    "       ..----..      ",
    "     .'   ..   '.    ",
    "    /    /  \\    \\   ",
    "   |    |    |    |  ",
    "   |    |    |    |  ",
    "    \\    \\  /    /   ",
    "     '.   ''   .'    ",
    "       ''----''      ",
  ],
  olive: [
    "         .          ",
    "        /|\\         ",
    "       / | \\        ",
    "      /  |  \\       ",
    "     /   |   \\      ",
    "    |    |    |     ",
    "    |    O    |     ",
    "     \\   O   /      ",
    "      \\  O  /       ",
    "       \\ O /        ",
    "        \\|/         ",
    "         |          ",
    "         |          ",
  ],
  tree: [
    "         /\\         ",
    "        /||\\        ",
    "       /||||\\       ",
    "      /||||||\\      ",
    "     /||||||||\\     ",
    "    /||||||||||\\    ",
    "   /||||||||||||\\   ",
    "  /||||||||||||||\\  ",
    " /||||||||||||||||\\ ",
    "|||||||||||||||||||||",
    "        |||||        ",
    "        |||||        ",
    "        |||||        ",
    "       /|||||\\       ",
    "      /|||||||\\      ",
    "     /|||||||||\\     ",
  ],
  crown: [
    "        .-''''-.         ",
    "       /        \\        ",
    "      |  /\\  /\\  |       ",
    "      | |  ||  | |       ",
    "      |  \\  /\\  /        ",
    "       \\   ||   /         ",
    "        |  ||  |          ",
    "        |__||__|          ",
    "        |______|          ",
  ],
  mountain: [
    "              /\\           ",
    "            /    \\         ",
    "          /   /\\   \\       ",
    "        /   /    \\   \\     ",
    "      /   /   /\\   \\   \\   ",
    "    /   /   /    \\   \\   \\ ",
    "  /___/___/______\\___\\___\\",
    " /                         \\",
    "/___________________________\\",
  ],
  people: [
    "       O     O     O       ",
    "      /|\\   /|\\   /|\\      ",
    "      / \\   / \\   / \\      ",
    "                            ",
    "     .---.   .---.   .---.  ",
    "    /     \\ /     \\ /     \\ ",
    "   |       |       |       |",
    "    \\_____/ \\_____/ \\_____/ ",
  ],
  flame: [
    "         /\\          ",
    "        /||\\         ",
    "       / || \\        ",
    "      /  ||  \\       ",
    "     /  /||\\  \\      ",
    "    |  / || \\  |     ",
    "    | /  ||  \\ |     ",
    "    ||   ||   ||      ",
    "     \\___||___/       ",
  ],
  lamp: [
    "          |           ",
    "         _|_          ",
    "        /   \\         ",
    "       |  *  |        ",
    "        \\ _ /         ",
    "         |||          ",
    "         |||          ",
    "        /|||\\         ",
    "       / ||| \\        ",
    "      /  |||  \\       ",
    "     /___|||___\\      ",
  ],
};

interface AsciiArtProps {
  name: keyof typeof illustrations;
  className?: string;
  animate?: boolean;
  color?: "charcoal" | "wheat" | "terracotta" | "sage" | "cream";
}

const colorMap = {
  charcoal: "text-charcoal/20",
  wheat: "text-wheat/30",
  terracotta: "text-terracotta/25",
  sage: "text-sage/25",
  cream: "text-cream/15",
};

export default function AsciiArt({
  name,
  className = "",
  animate = true,
  color = "charcoal",
}: AsciiArtProps) {
  const art = illustrations[name];
  if (!art) return null;

  const content = art.join("\n");

  if (animate) {
    return (
      <motion.pre
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className={`font-mono text-xs leading-[1.15] whitespace-pre select-none ${colorMap[color]} ${className}`}
      >
        {content}
      </motion.pre>
    );
  }

  return (
    <pre
      className={`font-mono text-xs leading-[1.15] whitespace-pre select-none ${colorMap[color]} ${className}`}
    >
      {content}
    </pre>
  );
}
