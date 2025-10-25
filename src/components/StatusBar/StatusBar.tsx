import { useEffect, useState } from "react";
import styled, { css } from "styled-components";

interface StatusBarProps {
  mistakesAllowed: number;
  mistakesRemaining: number;
}

const Container = styled.section`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Label = styled.p`
  display: flex;
  align-items: center;
  font-size: 15px;
`;

const MistakeTrack = styled.div`
  display: inline-flex;
  gap: 8px;
  translate: 0px 1px;
`;

const MistakePip = styled.span.attrs<{ $active: boolean; $reduceMotion: boolean }>(
  ({ $active, $reduceMotion }) => ({
  role: "img",
    "aria-label": $active ? "mistake remaining" : "mistake used",
    "data-state": $active ? "active" : "spent",
    "data-motion": $reduceMotion ? "reduced" : "standard",
  }),
)<{ $active: boolean; $reduceMotion: boolean }>`
  --pip-active: #e36363;
  --pip-spent: #f2d7b6;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(46, 39, 27, 0.4);
  background: ${({ $active }) => ($active ? "var(--pip-active)" : "var(--pip-spent)")};
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
