import type { Transition } from "framer-motion";
import type { WordCardFeedbackStatus } from "../../game/types";

export type CardFeedbackAnimation = {
  animate: {
    x?: number | number[];
    y?: number | number[];
    scale: number | number[];
  };
  transition: Transition;
};

const hopKeyframes: number[] = [0, -18, 0];
const hopTransition: Transition = {
  duration: 0.24,
  ease: [0.33, 1, 0.68, 1],
  times: [0, 0.5, 1],
};

const idleTransition: Transition = { duration: 0.18 };

const shakeKeyframes: number[] = [0, -21, 21, -14, 14, -7, 7, 0];
const shakeTransition: Transition = {
  duration: 0.22,
  ease: "easeInOut",
  times: [0, 0.18, 0.36, 0.54, 0.72, 0.86, 0.93, 1],
};

const cardFeedbackAnimations: Record<
  WordCardFeedbackStatus,
  CardFeedbackAnimation
> = {
  idle: {
    animate: { x: 0, y: 0, scale: 1 },
    transition: idleTransition,
  },
  hop: {
    animate: { x: 0, y: hopKeyframes, scale: 1 },
    transition: hopTransition,
  },
  shake: {
    animate: { x: shakeKeyframes, y: 0, scale: 1 },
    transition: shakeTransition,
  },
};

export const CARD_FEEDBACK_ANIMATIONS = cardFeedbackAnimations;
