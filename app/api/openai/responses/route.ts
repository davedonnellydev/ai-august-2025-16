import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { MODEL } from '@/app/config/constants';
import { InputValidator, ServerRateLimiter } from '@/app/lib/utils/api-helpers';

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Server-side rate limiting
    if (!ServerRateLimiter.checkLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const { topic, difficulty, questionCount, bloomLevel, format, inputType } =
      await request.json();

    // Enhanced validation
    const textValidation = InputValidator.validateText(topic, 2000);
    if (!textValidation.isValid) {
      return NextResponse.json(
        { error: textValidation.error },
        { status: 400 }
      );
    }

    // Environment validation
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { error: 'Translation service temporarily unavailable' },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey,
    });

    // Enhanced content moderation
    const moderatedText = await client.moderations.create({
      input: topic,
    });

    const { flagged, categories } = moderatedText.results[0];

    if (flagged) {
      const keys: string[] = Object.keys(categories);
      const flaggedCategories = keys.filter(
        (key: string) => categories[key as keyof typeof categories]
      );
      return NextResponse.json(
        {
          error: `Content flagged as inappropriate: ${flaggedCategories.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const FlashCard = z.object({
      question: z.string(),
      answer: z.string(),
      order: z.number(),
    });

    const QuestionSet = z.object({
      flashcards: z.array(FlashCard),
      difficulty: z.enum(['easy', 'medium', 'difficult', 'expert']),
      topic: z.string(),
    });

    const formatLabelMap: Record<string, string> = {
      qa: 'question and answer',
      cloze: 'cloze (fill-in-the-blank)',
      mcq: 'multiple-choice',
    };

    const inputTypeLabelMap: Record<string, string> = {
      text: 'topic description',
      markdown: 'markdown outline',
    };

    const selectedFormat =
      formatLabelMap[format as keyof typeof formatLabelMap] ||
      'question and answer';
    const selectedInputType =
      inputTypeLabelMap[inputType as keyof typeof inputTypeLabelMap] ||
      'topic description';

    const instructions: string =
      'You are an expert tutor and quiz generator. Create high-quality flashcards with pedagogical alignment to the specified Bloom level and requested card format, while strictly adhering to the provided output schema.';

    const userInput: string = `Please create a set of ${questionCount} flashcards of ${difficulty} difficulty, aligned with Bloom level "${bloomLevel}" and formatted as ${selectedFormat}. Use the ${selectedInputType} between the two sets of ### below as the source:
      ###
      ${topic}
      ###
      Guidance by format:
      - For question and answer: produce a clear question and an unambiguous answer.
      - For cloze (fill-in-the-blank): write the question with a single blank and put the missing term in the answer.
      - For multiple-choice: include plausible distractors within the question text and put the correct choice as the answer.
      Ensure that the output follows the structured schema provided.
      `;

    const response = await client.responses.parse({
      model: MODEL,
      instructions,
      input: userInput,
      text: {
        format: zodTextFormat(QuestionSet, 'question_set'),
      },
    });

    if (response.status !== 'completed') {
      throw new Error(`Responses API error: ${response.status}`);
    }

    return NextResponse.json({
      response: response.output_parsed || 'Response recieved',
      remainingRequests: ServerRateLimiter.getRemaining(ip),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'OpenAI failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
