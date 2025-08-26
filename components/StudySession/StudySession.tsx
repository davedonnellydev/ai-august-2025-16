'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Group,
  NumberInput,
  SegmentedControl,
  Stack,
  Stepper,
  Switch,
  Text,
  Title,
  Progress,
} from '@mantine/core';
import type { DeckData } from '@/components/DeckDetail/DeckDetail';

type StudyOrder = 'ordered' | 'random';

interface StudySessionProps {
  deck: DeckData;
}

export function StudySession({ deck }: StudySessionProps) {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [order, setOrder] = useState<StudyOrder>('ordered');
  const [timed, setTimed] = useState(false);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState<number>(30);

  const cards = useMemo(() => {
    const base = deck.cards.slice().sort((a, b) => a.order - b.order);
    if (order === 'random') {
      return shuffleArray(base);
    }
    return base;
  }, [deck.cards, order]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [remaining, setRemaining] = useState(secondsPerQuestion);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when starting or when cards change
  useEffect(() => {
    if (!started) return;
    setCurrentIndex(0);
    setShowAnswer(false);
    setRemaining(secondsPerQuestion);
  }, [started, cards, secondsPerQuestion]);

  // Handle timer per question
  useEffect(() => {
    if (!started || !timed) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setRemaining(secondsPerQuestion);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          // Auto-flip to answer on timeout
          setShowAnswer(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [started, timed, secondsPerQuestion, currentIndex]);

  const gotoIndex = useCallback(
    (idx: number) => {
      const bounded = Math.max(0, Math.min(idx, cards.length - 1));
      setCurrentIndex(bounded);
      setShowAnswer(false);
    },
    [cards.length]
  );

  const onPrev = () => gotoIndex(currentIndex - 1);
  const onNext = () => gotoIndex(currentIndex + 1);

  const activeCard = cards[currentIndex];
  const progressPct = useMemo(() => {
    if (cards.length === 0) return 0;
    return Math.round(((currentIndex + 1) / cards.length) * 100);
  }, [currentIndex, cards.length]);

  return (
    <Stack mt="xl" gap="md">
      <Group justify="space-between" align="center" wrap="wrap">
        <Title order={3}>Study: {deck.topic}</Title>
        <Button variant="subtle" onClick={() => router.push('/')}>Back to Dashboard</Button>
      </Group>

      {/* Pre-session controls */}
      {!started && (
        <Card withBorder shadow="sm" padding="md" component="section" aria-labelledby="study-options">
          <Title id="study-options" order={4} style={{ position: 'absolute', left: -9999 }}>
            Study options
          </Title>
          <Stack gap="md">
            <Group grow wrap="wrap">
              <SegmentedControl
                data={[
                  { value: 'ordered', label: 'In order' },
                  { value: 'random', label: 'Random' },
                ]}
                value={order}
                onChange={(v) => setOrder(v as StudyOrder)}
              />
              <Group align="end" gap="sm" wrap="wrap">
                <Switch
                  checked={timed}
                  onChange={(e) => setTimed(e.currentTarget.checked)}
                  label="Timed questions"
                />
                <NumberInput
                  label="Seconds/question"
                  min={5}
                  max={300}
                  disabled={!timed}
                  value={secondsPerQuestion}
                  onChange={(v) => setSecondsPerQuestion(Number(v) || 0)}
                  w={160}
                  aria-label="Seconds per question"
                />
              </Group>
            </Group>

            <Group>
              <Button onClick={() => setStarted(true)} variant="filled" color="cyan">
                Start session
              </Button>
            </Group>
          </Stack>
        </Card>
      )}

      {/* In-session UI */}
      {started && (
        <Stack gap="md">
          <Stepper
            active={currentIndex}
            onStepClick={(idx) => gotoIndex(idx)}
            allowNextStepsSelect={false}
            size="sm"
            aria-label="Study progress"
          >
            {cards.map((_, idx) => (
              <Stepper.Step key={idx} aria-label={`Question ${idx + 1}`} />
            ))}
          </Stepper>

          <Group justify="space-between" align="center" wrap="wrap">
            <Text c="dimmed" size="sm">
              {currentIndex + 1} / {cards.length}
            </Text>
            {timed && (
              <Group gap="xs" align="center" aria-live="polite">
                <Text size="sm" aria-atomic="true">{remaining}s</Text>
                <Progress value={(remaining / secondsPerQuestion) * 100} w={160} aria-label="Time remaining" />
              </Group>
            )}
          </Group>

          <FlipCard question={activeCard.question} answer={activeCard.answer} showAnswer={showAnswer} format={deck.format} />

          <Group justify="space-between" wrap="wrap">
            <Button variant="light" onClick={onPrev} disabled={currentIndex === 0}>
              Previous
            </Button>
            {!showAnswer ? (
              <Button variant="filled" color="cyan" onClick={() => setShowAnswer(true)}>
                Show answer
              </Button>
            ) : currentIndex === cards.length - 1 ? (
              <Button variant="filled" color="cyan" onClick={() => router.push('/')}> 
                Finish
              </Button>
            ) : (
              <Button variant="filled" color="cyan" onClick={onNext} disabled={currentIndex === cards.length - 1}>
                Next
              </Button>
            )}
            <Button variant="subtle" onClick={() => setStarted(false)}>
              Restart
            </Button>
          </Group>
        </Stack>
      )}
    </Stack>
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface FlipCardProps {
  question: string;
  answer: string;
  showAnswer: boolean;
  format: DeckData['format'];
}

function FlipCard({ question, answer, showAnswer, format }: FlipCardProps) {
  const containerStyle: React.CSSProperties = {
    perspective: '1000px',
  };
  const cardStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    minHeight: 180,
    transformStyle: 'preserve-3d',
    transition: 'transform 0.6s',
    transform: showAnswer ? 'rotateY(180deg)' : 'rotateY(0deg)',
  };
  const faceStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    backfaceVisibility: 'hidden',
  };
  const backStyle: React.CSSProperties = {
    ...faceStyle,
    transform: 'rotateY(180deg)',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle} role="group" aria-roledescription="flashcard">
        <Card withBorder shadow="sm" padding="lg" style={faceStyle} aria-hidden={showAnswer}>
          <Stack>
            <Text c="dimmed" size="sm">
              Question
            </Text>
            <Text size="lg">{question}</Text>
          </Stack>
        </Card>

        <Card withBorder shadow="sm" padding="lg" style={backStyle} aria-hidden={!showAnswer}>
          <Stack>
            <Text c="dimmed" size="sm">
              Answer
            </Text>
            {format === 'cloze' ? (
              <Text size="lg">{renderClozeFilled(question, answer)}</Text>
            ) : (
              <Text size="lg">{answer}</Text>
            )}
          </Stack>
        </Card>
      </div>
    </div>
  );
}

function renderClozeFilled(question: string, answer: string) {
  // Replace the first run of 3+ underscores with the answer underlined
  const match = question.match(/_{3,}/);
  if (match) {
    const idx = match.index || 0;
    const before = question.slice(0, idx);
    const after = question.slice(idx + match[0].length);
    return (
      <>
        {before}
        <span style={{ borderBottom: '2px solid currentColor' }}>{answer}</span>
        {after}
      </>
    );
  }
  // Fallback if no blank found: show full sentence then answer in parentheses
  return (
    <>
      {question} (<span style={{ borderBottom: '2px solid currentColor' }}>{answer}</span>)
    </>
  );
}

export default StudySession;


