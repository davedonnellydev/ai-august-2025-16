'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import type { DeckData } from '@/components/DeckDetail/DeckDetail';

function loadDecks(): DeckData[] {
  try {
    const raw = localStorage.getItem('decks');
    return raw ? (JSON.parse(raw) as DeckData[]) : [];
  } catch {
    return [];
  }
}

function saveDecks(decks: DeckData[]) {
  localStorage.setItem('decks', JSON.stringify(decks));
}

export default function HomePage() {
  const [decks, setDecks] = useState<DeckData[]>([]);

  useEffect(() => {
    setDecks(loadDecks());
  }, []);

  const groupedByTopic = useMemo(() => {
    const map = new Map<string, DeckData[]>();
    for (const deck of decks) {
      const key = deck.topic || 'Untitled';
      const list = map.get(key) || [];
      list.push(deck);
      map.set(key, list);
    }
    // Sort each group's decks by updatedAt desc
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [decks]);

  const mostRecentDeck = useMemo(() => {
    return decks.slice().sort((a, b) => b.updatedAt - a.updatedAt)[0] || null;
  }, [decks]);

  const deleteDeck = (id: string) => {
    const next = decks.filter((d) => d.id !== id);
    setDecks(next);
    saveDecks(next);
  };

  return (
    <Stack mt="xl" gap="md">
      <Group justify="space-between" align="center">
        <Stack gap={4}>
          <Title order={2}>Your Decks</Title>
          <Text c="dimmed" size="sm">
            Manage, edit, and study your generated flashcard decks
          </Text>
        </Stack>
        <Group>
          <Button
            component={Link}
            href={mostRecentDeck ? `/study/${mostRecentDeck.id}` : '/new'}
            variant="filled"
            color="cyan"
          >
            {mostRecentDeck ? 'Continue studying' : 'Create your first deck'}
          </Button>
          <Button component={Link} href="/new" variant="light" color="cyan">
            New Deck
          </Button>
        </Group>
      </Group>

      <Divider />

      {groupedByTopic.length === 0 && (
        <Card withBorder shadow="sm" padding="lg">
          <Stack align="center" gap="xs">
            <Text>No decks yet.</Text>
            <Button component={Link} href="/new" variant="filled" color="cyan">
              Create a deck
            </Button>
          </Stack>
        </Card>
      )}

      {groupedByTopic.map(([topic, topicDecks]) => (
        <Stack key={topic} gap="sm">
          <Group>
            <Title order={4}>{topic}</Title>
            <Badge color="gray" variant="light">
              {topicDecks.length} deck{topicDecks.length === 1 ? '' : 's'}
            </Badge>
          </Group>

          <Stack gap="sm">
            {topicDecks.map((deck) => (
              <Card key={deck.id} withBorder shadow="sm" padding="md">
                <Group justify="space-between" align="center">
                  <Stack gap={2}>
                    <Text fw={600}>{deck.topic}</Text>
                    <Group gap="xs">
                      <Badge size="sm" variant="light">
                        {deck.difficulty}
                      </Badge>
                      <Badge size="sm" variant="light">
                        {deck.bloomLevel}
                      </Badge>
                      <Badge size="sm" variant="light">
                        {deck.format}
                      </Badge>
                      <Badge size="sm" variant="light">
                        {deck.cards.length} cards
                      </Badge>
                    </Group>
                    <Text c="dimmed" size="xs">
                      Updated {new Date(deck.updatedAt).toLocaleString()}
                    </Text>
                  </Stack>

                  <Group>
                    <Button component={Link} href={`/study/${deck.id}`} variant="filled" color="cyan">
                      Study
                    </Button>
                    <Button component={Link} href={`/decks/${deck.id}`} variant="light" color="cyan">
                      Edit
                    </Button>
                    <ActionIcon
                      aria-label="Delete deck"
                      color="red"
                      variant="subtle"
                      onClick={() => deleteDeck(deck.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}
