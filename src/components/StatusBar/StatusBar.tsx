import { useEffect, useState } from "react";
import styled, { css } from "styled-components";

interface StatusBarProps {
  mistakesAllowed: number;
  mistakesRemaining: number;
}

const Container = styled.section`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Label = styled.p`
  display: flex;
  align-items: center;
  font-size: 0.9375rem;
`;

const MistakeTrack = styled.div`
  display: inline-flex;
  gap: 0.5rem;
  translate: 0 0.0625rem;
`;

const MistakePip = styled.span.attrs<{ $active: boolean; $reduceMotion: boolean }>(
  ({ $active, $reduceMotion }) => ({
  role: "img",
    "aria-label": $active ? "mistake remaining" : "mistake used",
    "data-state": $active ? "active" : "spent",
    "data-motion": $reduceMotion ? "reduced" : "standard",
  }),
)<{ $active: boolean; $reduceMotion: boolean }>`
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  border: 1px solid rgba(46, 39, 27, 0.4);
  background: ${({ $active }) =>
    $active ? "var(--status-pip-active)" : "var(--status-pip-spent)"};
  transform: ${({ $active, $reduceMotion }) =>
    $reduceMotion || $active ? "scale(1)" : "scale(0.6)"};
  opacity: ${({ $active, $reduceMotion }) =>
    $reduceMotion || $active ? 1 : 0.4};
  transition: ${({ $reduceMotion }) =>
    $reduceMotion
      ? "background-color 0.18s ease-out, border-color 0.18s ease-out"
      : "transform 0.18s ease-out, opacity 0.18s ease-out, background-color 0.18s ease-out, border-color 0.18s ease-out"};
  will-change: ${({ $reduceMotion }) =>
    $reduceMotion ? "auto" : "transform, opacity"};

  ${({ $reduceMotion }) =>
    $reduceMotion &&
    css`
      transform-origin: center;
    `}
`;

const prefersReducedMotionQuery = "(prefers-reduced-motion: reduce)";

const usePrefersReducedMotion = (): boolean => {
  const getPreference = () =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(prefersReducedMotionQuery).matches;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    getPreference,
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(prefersReducedMotionQuery);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    setPrefersReducedMotion(mediaQuery.matches);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
};

const StatusBar = ({ mistakesAllowed, mistakesRemaining }: StatusBarProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <Container>
      <Label>Mistakes Remaining: </Label>
      <MistakeTrack>
        {Array.from({ length: mistakesAllowed }).map((_, index) => {
          const pipActive = index < mistakesRemaining;
          return (
            <MistakePip
              key={index}
              $active={pipActive}
              $reduceMotion={prefersReducedMotion}
            />
          );
        })}
      </MistakeTrack>
    </Container>
  );
};

export default StatusBar;
