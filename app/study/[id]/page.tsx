'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { DeckData } from '@/components/DeckDetail/DeckDetail';
import { StudySession } from '@/components/StudySession/StudySession';
import { Button, Container, Stack, Text } from '@mantine/core';

function loadDecks(): DeckData[] {
  try {
    const raw = localStorage.getItem('decks');
    return raw ? (JSON.parse(raw) as DeckData[]) : [];
  } catch {
    return [];
  }
}

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = useMemo(() => String(params?.id || ''), [params]);
  const [deck, setDeck] = useState<DeckData | null>(null);

  useEffect(() => {
    const all = loadDecks();
    setDeck(all.find((d) => d.id === deckId) || null);
  }, [deckId]);

  if (!deck) {
    return (
      <Stack align="center" mt="xl">
        <Text>Deck not found.</Text>
        <Button onClick={() => router.push('/')}>Go to Dashboard</Button>
      </Stack>
    );
  }

  return (
    <Container size="lg">
      <div style={{ maxWidth: 900, margin: '20px auto', padding: '20px' }}>
        <StudySession deck={deck} />
      </div>
    </Container>
  );
}
