'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
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

type Topic = { id: string; name: string };

function loadTopics(): Topic[] {
  try {
    const raw = localStorage.getItem('topics');
    const parsed = raw ? (JSON.parse(raw) as Topic[]) : [];
    if (!parsed.find((t) => t.name === 'General Decks')) {
      const seed = [{ id: 'general', name: 'General Decks' }];
      localStorage.setItem('topics', JSON.stringify(seed));
      return seed;
    }
    return parsed;
  } catch {
    const seed = [{ id: 'general', name: 'General Decks' }];
    localStorage.setItem('topics', JSON.stringify(seed));
    return seed;
  }
}

function saveTopics(topics: Topic[]) {
  localStorage.setItem('topics', JSON.stringify(topics));
}

export default function HomePage() {
  const [decks, setDecks] = useState<DeckData[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopicName, setNewTopicName] = useState('');

  useEffect(() => {
    const loaded = loadDecks();
    // Migration: ensure each deck has a stable title independent of topic grouping
    let migrated = loaded;
    let changed = false;
    migrated = loaded.map((d) => {
      if (!('title' in d) || !d.title) {
        changed = true;
        return { ...d, title: d.topic } as DeckData;
      }
      return d;
    });
    if (changed) {
      saveDecks(migrated);
    }
    setDecks(migrated);
    setTopics(loadTopics());
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

  const createTopic = () => {
    const name = newTopicName.trim();
    if (!name) {
      return;
    }
    if (topics.find((t) => t.name.toLowerCase() === name.toLowerCase())) {
      return;
    }
    const next = [...topics, { id: generateId('topic'), name }];
    setTopics(next);
    saveTopics(next);
    setNewTopicName('');
  };

  function generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  const updateDeckTopic = (deckId: string, topicName: string) => {
    setDecks((prev) => {
      const next = prev.map((d) =>
        d.id === deckId ? { ...d, topic: topicName } : d
      );
      saveDecks(next);
      return next;
    });
  };

  const deleteTopic = (topicId: string) => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic || topic.name === 'General Decks') {
      return;
    }

    const nextTopics = topics.filter((t) => t.id !== topicId);
    setTopics(nextTopics);
    saveTopics(nextTopics);

    // Reassign decks under this topic back to General Decks
    setDecks((prev) => {
      const updated = prev.map((d) =>
        d.topic === topic.name ? { ...d, topic: 'General Decks' } : d
      );
      saveDecks(updated);
      return updated;
    });
  };

  return (
    <Container size="lg">
      <Stack mt="xl" gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Stack gap={4}>
            <Title order={2}>Your Decks</Title>
            <Text c="dimmed" size="sm">
              Manage, edit, and study your generated flashcard decks
            </Text>
          </Stack>
          <Group wrap="wrap">
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

        <Card
          withBorder
          shadow="sm"
          padding="md"
          component="section"
          aria-labelledby="topics-admin"
        >
          <Stack gap="sm">
            <Title id="topics-admin" order={4}>
              Topics
            </Title>
            <Group wrap="wrap">
              {topics.map((t) => (
                <Group key={t.id} gap="xs" align="center">
                  <Badge variant="light">{t.name}</Badge>
                  {t.name !== 'General Decks' && (
                    <ActionIcon
                      aria-label={`Delete topic ${t.name}`}
                      color="red"
                      variant="subtle"
                      onClick={() => deleteTopic(t.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  )}
                </Group>
              ))}
            </Group>
            <Group wrap="wrap">
              <input
                aria-label="New topic name"
                placeholder="New topic"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.currentTarget.value)}
                style={{
                  padding: 8,
                  border: '1px solid var(--mantine-color-gray-4)',
                  borderRadius: 6,
                }}
              />
              <Button onClick={createTopic} variant="light">
                Add topic
              </Button>
            </Group>
          </Stack>
        </Card>

        {groupedByTopic.length === 0 && (
          <Card withBorder shadow="sm" padding="lg" aria-live="polite">
            <Stack align="center" gap="xs">
              <Text>No decks yet.</Text>
              <Button
                component={Link}
                href="/new"
                variant="filled"
                color="cyan"
              >
                Create a deck
              </Button>
            </Stack>
          </Card>
        )}

        {groupedByTopic.map(([topic, topicDecks]) => (
          <Stack key={topic} gap="sm">
            <Group wrap="wrap">
              <Title order={4}>{topic}</Title>
              <Badge color="gray" variant="light">
                {topicDecks.length} deck{topicDecks.length === 1 ? '' : 's'}
              </Badge>
            </Group>

            <Stack gap="sm">
              {topicDecks.map((deck) => (
                <Card
                  key={deck.id}
                  withBorder
                  shadow="sm"
                  padding="md"
                  component="section"
                  aria-labelledby={`deck-${deck.id}-title`}
                >
                  <Group justify="space-between" align="center" wrap="wrap">
                    <Stack gap={2}>
                      <Text id={`deck-${deck.id}-title`} fw={600}>
                        {deck.title || deck.topic}
                      </Text>
                      <Group gap="xs" wrap="wrap">
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
                        <Badge size="sm" variant="outline">
                          {deck.topic}
                        </Badge>
                      </Group>
                      <Text c="dimmed" size="xs">
                        Updated {new Date(deck.updatedAt).toLocaleString()}
                      </Text>
                    </Stack>

                    <Group wrap="wrap">
                      <select
                        aria-label="Assign topic"
                        value={deck.topic}
                        onChange={(e) =>
                          updateDeckTopic(deck.id, e.currentTarget.value)
                        }
                        style={{
                          padding: 8,
                          border: '1px solid var(--mantine-color-gray-4)',
                          borderRadius: 6,
                        }}
                      >
                        {topics.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        component={Link}
                        href={`/study/${deck.id}`}
                        variant="filled"
                        color="cyan"
                      >
                        Study
                      </Button>
                      <Button
                        component={Link}
                        href={`/decks/${deck.id}`}
                        variant="light"
                        color="cyan"
                      >
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
    </Container>
  );
}
