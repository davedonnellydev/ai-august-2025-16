'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import {
  IconArrowDown,
  IconArrowUp,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react';
import { ClientRateLimiter } from '@/app/lib/utils/api-helpers';
import Link from 'next/link';
import { Button as MantineButton } from '@mantine/core';

type Difficulty = 'easy' | 'medium' | 'difficult' | 'expert';
type BloomLevel = 'remember' | 'understand' | 'apply';
type Format = 'qa' | 'cloze' | 'mcq';

export interface DeckCard {
  id: string;
  order: number;
  question: string;
  answer: string;
}

export interface DeckData {
  id: string;
  topic: string;
  difficulty: Difficulty;
  bloomLevel: BloomLevel;
  format: Format;
  inputType: 'text' | 'markdown';
  cards: DeckCard[];
  createdAt: number;
  updatedAt: number;
}

interface DeckDetailProps {
  deck: DeckData;
}

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCards(
  cards: Array<{ question: string; answer: string; order: number }>
): DeckCard[] {
  return cards
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      id: generateId('card'),
      order: c.order,
      question: c.question,
      answer: c.answer,
    }));
}

function loadAllDecks(): DeckData[] {
  try {
    const raw = localStorage.getItem('decks');
    return raw ? (JSON.parse(raw) as DeckData[]) : [];
  } catch {
    return [];
  }
}

function saveAllDecks(decks: DeckData[]) {
  localStorage.setItem('decks', JSON.stringify(decks));
}

function upsertDeck(updated: DeckData) {
  const all = loadAllDecks();
  const idx = all.findIndex((d) => d.id === updated.id);
  if (idx >= 0) {
    all[idx] = updated;
  } else {
    all.push(updated);
  }
  saveAllDecks(all);
}

export function DeckDetail({ deck }: DeckDetailProps) {
  const [currentDeck, setCurrentDeck] = useState<DeckData>(deck);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCurrentDeck(deck);
  }, [deck]);

  // Persist to localStorage automatically on changes
  useEffect(() => {
    upsertDeck(currentDeck);
  }, [currentDeck]);

  const sortedCards = useMemo(
    () => currentDeck.cards.slice().sort((a, b) => a.order - b.order),
    [currentDeck.cards]
  );

  const updateCard = (id: string, fields: Partial<DeckCard>) => {
    setCurrentDeck((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      cards: prev.cards.map((c) => (c.id === id ? { ...c, ...fields } : c)),
    }));
  };

  const deleteCard = (id: string) => {
    setCurrentDeck((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      cards: prev.cards
        .filter((c) => c.id !== id)
        .map((c, idx) => ({ ...c, order: idx + 1 })),
    }));
  };

  const addCard = () => {
    setCurrentDeck((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      cards: [
        ...prev.cards,
        {
          id: generateId('card'),
          order: prev.cards.length + 1,
          question: '',
          answer: '',
        },
      ],
    }));
  };

  const moveCard = (id: string, direction: 'up' | 'down') => {
    setCurrentDeck((prev) => {
      const cards = prev.cards.slice().sort((a, b) => a.order - b.order);
      const index = cards.findIndex((c) => c.id === id);
      if (index === -1) {
        return prev;
      }
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= cards.length) {
        return prev;
      }
      const tempOrder = cards[index].order;
      cards[index].order = cards[swapWith].order;
      cards[swapWith].order = tempOrder;
      return { ...prev, updatedAt: Date.now(), cards };
    });
  };

  const regenerateCard = async (id: string) => {
    const target = currentDeck.cards.find((c) => c.id === id);
    if (!target) {
      return;
    }

    if (!ClientRateLimiter.checkLimit()) {
      setError('Rate limit exceeded. Please try again later.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/openai/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentDeck.topic,
          difficulty: currentDeck.difficulty,
          questionCount: 1,
          bloomLevel: currentDeck.bloomLevel,
          format: currentDeck.format,
          inputType: currentDeck.inputType,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API call failed');
      }
      const result = await response.json();
      const parsed = result.response;
      const newCard = Array.isArray(parsed?.flashcards)
        ? parsed.flashcards[0]
        : null;
      if (newCard) {
        updateCard(id, { question: newCard.question, answer: newCard.answer });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'API failed');
    } finally {
      setLoading(false);
    }
  };

  const regenerateDeck = async () => {
    if (!ClientRateLimiter.checkLimit()) {
      setError('Rate limit exceeded. Please try again later.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/openai/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentDeck.topic,
          difficulty: currentDeck.difficulty,
          questionCount: currentDeck.cards.length,
          bloomLevel: currentDeck.bloomLevel,
          format: currentDeck.format,
          inputType: currentDeck.inputType,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API call failed');
      }
      const result = await response.json();
      const parsed = result.response;
      if (Array.isArray(parsed?.flashcards)) {
        const updatedCards = normalizeCards(parsed.flashcards);
        setCurrentDeck((prev) => ({
          ...prev,
          cards: updatedCards,
          updatedAt: Date.now(),
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'API failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack mt="xl" gap="md">
      <Group justify="space-between">
        <Title order={3}>Deck: {currentDeck.topic}</Title>
        <Group>
          <MantineButton component={Link} href={`/study/${currentDeck.id}`} variant="filled" color="cyan">
            Study with this Deck
          </MantineButton>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={regenerateDeck}
            loading={loading}
            variant="light"
          >
            Regenerate Deck
          </Button>
          <Button onClick={addCard} variant="filled">
            Add Card
          </Button>
        </Group>
      </Group>

      {error && <Text c="red">Error: {error}</Text>}

      {sortedCards.map((card, index) => (
        <Card key={card.id} withBorder shadow="sm" padding="md">
          <Group justify="space-between" mb="sm">
            <Text fw={600}>Card {index + 1}</Text>
            <Group gap="xs">
              <ActionIcon
                aria-label="Move up"
                onClick={() => moveCard(card.id, 'up')}
                variant="subtle"
              >
                <IconArrowUp size={16} />
              </ActionIcon>
              <ActionIcon
                aria-label="Move down"
                onClick={() => moveCard(card.id, 'down')}
                variant="subtle"
              >
                <IconArrowDown size={16} />
              </ActionIcon>
              <ActionIcon
                aria-label="Regenerate"
                onClick={() => regenerateCard(card.id)}
                loading={loading}
                variant="subtle"
              >
                <IconRefresh size={16} />
              </ActionIcon>
              <ActionIcon
                aria-label="Delete"
                color="red"
                onClick={() => deleteCard(card.id)}
                variant="subtle"
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </Group>
          <Stack gap="xs">
            <Textarea
              label="Question"
              autosize
              minRows={2}
              value={card.question}
              onChange={(e) =>
                updateCard(card.id, { question: e.currentTarget.value })
              }
            />
            <Textarea
              label="Answer"
              autosize
              minRows={2}
              value={card.answer}
              onChange={(e) =>
                updateCard(card.id, { answer: e.currentTarget.value })
              }
            />
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
