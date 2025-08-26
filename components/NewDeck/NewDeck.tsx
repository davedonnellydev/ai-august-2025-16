'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  Text,
  Textarea,
  Title,
  Tabs,
  Select,
  NumberInput,
  Group,
  Stack,
  SegmentedControl,
} from '@mantine/core';
import { ClientRateLimiter } from '@/app/lib/utils/api-helpers';
import classes from './NewDeck.module.css';
import { DeckDetail, type DeckData } from '@/components/DeckDetail/DeckDetail';

type InputMode = 'text' | 'markdown';
type Difficulty = 'easy' | 'medium' | 'difficult' | 'expert';
type BloomLevel = 'remember' | 'understand' | 'apply';
type Format = 'qa' | 'cloze' | 'mcq';

export function NewDeck() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [description, setDescription] = useState('');
  const [outline, setOutline] = useState('');
  const [deckSize, setDeckSize] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [bloomLevel, setBloomLevel] = useState<BloomLevel>('understand');
  const [format, setFormat] = useState<Format>('qa');

  const [response, setResponse] = useState('');
  const [generatedDeck, setGeneratedDeck] = useState<DeckData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingRequests, setRemainingRequests] = useState(0);

  useEffect(() => {
    setRemainingRequests(ClientRateLimiter.getRemainingRequests());
  }, []);

  const getTopicContent = (): string =>
    inputMode === 'text' ? description : outline;

  const handleRequest = async () => {
    const topic = getTopicContent();
    if (!topic.trim()) {
      setError('Please enter a description or outline');
      return;
    }

    if (!ClientRateLimiter.checkLimit()) {
      setError('Rate limit exceeded. Please try again later.');
      setRemainingRequests(ClientRateLimiter.getRemainingRequests());
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/openai/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          difficulty,
          questionCount: deckSize,
          bloomLevel,
          format,
          inputType: inputMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API call failed');
      }

      const result = await response.json();
      setResponse(result.response);
      setRemainingRequests(ClientRateLimiter.getRemainingRequests());

      // Create and persist deck from response
      const parsed = result.response;
      const cards = Array.isArray(parsed?.flashcards)
        ? parsed.flashcards
            .slice()
            .sort((a: any, b: any) => a.order - b.order)
            .map((c: any, idx: number) => ({
              id: generateId('card'),
              order: idx + 1,
              question: c.question,
              answer: c.answer,
            }))
        : [];

      const deck: DeckData = {
        id: generateId('deck'),
        topic: parsed?.topic || topic,
        difficulty,
        bloomLevel,
        format,
        inputType: inputMode,
        cards,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setGeneratedDeck(deck);
      persistDeck(deck);
      // Navigate to Deck Detail automatically
      router.push(`/decks/${deck.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setDescription('');
    setOutline('');
    setDeckSize(10);
    setDifficulty('medium');
    setBloomLevel('understand');
    setFormat('qa');
    setResponse('');
    setError('');
    setGeneratedDeck(null);
  };

  function generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function persistDeck(deck: DeckData) {
    try {
      const raw = localStorage.getItem('decks');
      const all = raw ? (JSON.parse(raw) as DeckData[]) : [];
      const idx = all.findIndex((d) => d.id === deck.id);
      if (idx >= 0) {
        all[idx] = deck;
      } else {
        all.unshift(deck);
      }
      localStorage.setItem('decks', JSON.stringify(all));
    } catch {
      // ignore persistence errors
    }
  }

  return (
    <>
      <div style={{ maxWidth: 900, margin: '20px auto', padding: '0 20px' }}>
        <Button component={Link} href="/" variant="subtle">
          Back to Dashboard
        </Button>
      </div>
      <Title className={classes.title} ta="center" mt={100}>
        Create a new{' '}
        <Text
          inherit
          variant="gradient"
          component="span"
          gradient={{ from: 'pink', to: 'yellow' }}
        >
          Deck
        </Text>
      </Title>

      <div style={{ maxWidth: 800, margin: '20px auto', padding: '20px' }}>
        <Tabs
          value={inputMode}
          onChange={(v) => setInputMode((v as InputMode) || 'text')}
        >
          <Tabs.List>
            <Tabs.Tab value="text">Paste Text</Tabs.Tab>
            <Tabs.Tab value="markdown">Markdown</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="text" pt="xs">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
              size="md"
              radius="md"
              label="Topic description"
              placeholder="e.g., A concise description of the topic you want to study"
              autosize
              minRows={6}
            />
          </Tabs.Panel>

          <Tabs.Panel value="markdown" pt="xs">
            <Textarea
              value={outline}
              onChange={(event) => setOutline(event.currentTarget.value)}
              size="md"
              radius="md"
              label="Markdown outline"
              placeholder="e.g., # Topic\n- Subtopic 1\n- Subtopic 2"
              autosize
              minRows={6}
            />
          </Tabs.Panel>
        </Tabs>

        <Stack gap="md" mt="md">
          <Group grow>
            <NumberInput
              label="Deck size"
              min={1}
              max={50}
              value={deckSize}
              onChange={(val) => setDeckSize(Number(val) || 0)}
            />
            <Select
              label="Difficulty"
              data={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'difficult', label: 'Difficult' },
                { value: 'expert', label: 'Expert' },
              ]}
              value={difficulty}
              onChange={(val) => setDifficulty((val as Difficulty) || 'medium')}
              allowDeselect={false}
            />
          </Group>

          <Group grow>
            <Select
              label="Bloom level"
              data={[
                { value: 'remember', label: 'Remember' },
                { value: 'understand', label: 'Understand' },
                { value: 'apply', label: 'Apply' },
              ]}
              value={bloomLevel}
              onChange={(val) =>
                setBloomLevel((val as BloomLevel) || 'understand')
              }
              allowDeselect={false}
            />
            <SegmentedControl
              data={[
                { value: 'qa', label: 'Q/A' },
                { value: 'cloze', label: 'Cloze' },
                { value: 'mcq', label: 'MCQ' },
              ]}
              value={format}
              onChange={(val) => setFormat(val as Format)}
            />
          </Group>
        </Stack>

        <Group mt="md">
          <Button
            variant="filled"
            color="cyan"
            onClick={() => handleRequest()}
            loading={isLoading}
          >
            Generate Deck
          </Button>
          <Button variant="light" color="cyan" onClick={() => handleReset()}>
            Reset
          </Button>
        </Group>

        {error && (
          <Text c="red" ta="center" size="lg" maw={580} mx="auto" mt="xl">
            Error: {error}
          </Text>
        )}

        {response && !generatedDeck && (
          <Text c="dimmed" ta="center" size="lg" maw={580} mx="auto" mt="xl">
            Preview: {JSON.stringify(response)}
          </Text>
        )}
      </div>

      <Text c="dimmed" ta="center" size="sm" maw={580} mx="auto" mt="xl">
        You have {remainingRequests} Deck generations remaining.
      </Text>

      {generatedDeck && (
        <div style={{ maxWidth: 900, margin: '20px auto', padding: '20px' }}>
          <DeckDetail deck={generatedDeck} />
        </div>
      )}
    </>
  );
}
